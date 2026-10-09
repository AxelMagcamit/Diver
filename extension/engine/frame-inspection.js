import { collectPasswordForms } from "./form-collector.js";
import { analyzePasswordForms } from "./form-analyzer.js";

export async function inspectTabFrames(tab) {
  const topEntries = await chrome.scripting.executeScript({
    target: {
      tabId: tab.id,
      frameIds: [0]
    },
    world: "ISOLATED",
    func: collectPasswordForms
  });

  const top = topEntries.find(entry => entry.frameId === 0);

  if (
    !top?.documentId ||
    top.result?.pageUrl !== tab.url
  ) {
    throw new Error(
      "The top document changed during inspection."
    );
  }

  let entries;
  let partialInspection = false;

  try {
    entries = await chrome.scripting.executeScript({
      target: {
        tabId: tab.id,
        allFrames: true
      },
      world: "ISOLATED",
      func: collectPasswordForms
    });

    const currentTop = entries.find(
      entry => entry.frameId === 0
    );

    if (
      currentTop?.documentId !== top.documentId ||
      currentTop.result?.pageUrl !== tab.url
    ) {
      throw new Error(
        "The top document changed during inspection."
      );
    }
  } catch {
    // Keep top-page results if all-frame inspection fails.
    const verification = await chrome.scripting.executeScript({
      target: {
        tabId: tab.id,
        documentIds: [top.documentId]
      },
      world: "ISOLATED",
      func: () => document.URL
    });

    if (verification[0]?.result !== tab.url) {
      throw new Error(
        "The top document is no longer current."
      );
    }

    entries = [top];
    partialInspection = true;
  }

  const analysis = {
    passwordForms: 0,
    inspectedDocuments: 0,
    skippedDocuments: 0,
    partialInspection,
    pageFindings: [],
    results: []
  };

  let unassociatedPasswordFields = 0;

  for (
    const entry of entries.sort(
      (a, b) => a.frameId - b.frameId
    )
  ) {
    const snapshot = entry.result;

    if (
      !/^https?:\/\//i.test(snapshot?.pageUrl ?? "")
    ) {
      analysis.skippedDocuments++;
      continue;
    }

    try {
      const frame = analyzePasswordForms(
        snapshot.pageUrl,
        snapshot.forms,
        {
          baseUrl: snapshot.baseUrl,
          unassociatedPasswordFields:
            snapshot.unassociatedPasswordFields
        }
      );

      const label = entry.frameId === 0
        ? "Top page"
        : `Embedded frame ${entry.frameId} (${new URL(snapshot.pageUrl).origin})`;

      const annotate = finding => ({
        ...finding,
        explanation: `${label}. ${finding.explanation}`
      });

      analysis.pageFindings.push(
        ...frame.pageFindings.map(annotate)
      );

      for (const form of frame.results) {
        analysis.results.push({
          ...form,
          formIndex: analysis.results.length,
          findings: form.findings.map(annotate),
          submitterResults: form.submitterResults.map(
            button => ({
              ...button,
              findings: button.findings.map(annotate)
            })
          )
        });
      }

      analysis.passwordForms += frame.passwordForms;
      analysis.inspectedDocuments++;

      unassociatedPasswordFields +=
        snapshot.unassociatedPasswordFields;
    } catch {
      analysis.skippedDocuments++;
    }
  }

  if (analysis.inspectedDocuments === 0) {
    throw new Error(
      "No supported document could be inspected."
    );
  }

  return {
    topDocumentId: top.documentId,
    snapshot: {
      unassociatedPasswordFields
    },
    analysis
  };
}