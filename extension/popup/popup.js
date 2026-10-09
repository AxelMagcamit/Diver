import { analyzeUrl } from "../engine/analyzer.js";
import { getSiteIdentity } from "../engine/site-identity.js";
import { collectPasswordForms } from "../engine/form-collector.js";
import { analyzePasswordForms } from "../engine/form-analyzer.js";
import { getAutomaticWarning } from "../engine/warning-policy.js";

const element = id => document.getElementById(id);

function getRiskLevel(score) {
  if (score >= 60) return "High risk";
  if (score >= 30) return "Suspicious";
  if (score > 0) return "Some suspicious signals";

  return "No suspicious URL signals";
}

function addMessage(container, message) {
  const item = document.createElement("li");
  item.textContent = message;
  container.append(item);
}

function appendFinding(container, titleText, explanationText) {
  const item = document.createElement("li");
  const title = document.createElement("strong");
  const explanation = document.createElement("p");

  title.textContent = titleText;
  explanation.textContent = explanationText;

  item.append(title, explanation);
  container.append(item);
}

function renderWarning(warning) {
  element("automatic-warning")?.remove();

  if (!warning.warn) return;

  const section = document.createElement("section");
  section.id = "automatic-warning";
  section.className = "page-card";
  section.setAttribute("role", "alert");
  section.style.borderColor = "#e1ad55";

  const title = document.createElement("h2");
  title.textContent = "Diver warning";

  const message = document.createElement("p");
  message.textContent =
    "Review these risks before entering information. This is not a confirmed phishing verdict.";

  const list = document.createElement("ul");

  for (const reason of warning.reasons) {
    addMessage(list, reason);
  }

  section.append(title, message, list);
  document.querySelector(".brand-header").after(section);
}

function renderFormFindings(snapshot, analysis) {
  const container = element("form-findings");

  container.replaceChildren();
  element("form-coverage").hidden = false;

  const count = analysis.passwordForms;

  element("form-status").textContent = count === 0
    ? "No password forms found in this document."
    : `${count} password ${count === 1 ? "form" : "forms"} inspected.`;

  let findingCount = 0;

  for (const finding of analysis.pageFindings ?? []) {
    appendFinding(
      container,
      `${finding.id}: ${finding.title}`,
      finding.explanation
    );

    findingCount++;
  }

  let skipped = 0;

  for (const form of analysis.results) {
    const contexts = [
      {
        label: `Form ${form.formIndex + 1}, default action`,
        result: form
      },
      ...form.submitterResults.map(button => ({
        label:
          `Form ${form.formIndex + 1}, submit-button override ${button.submitterIndex + 1}`,
        result: button
      }))
    ];

    skipped += form.skippedDisabledSubmitters;

    for (const context of contexts) {
      for (const finding of context.result.findings) {
        appendFinding(
          container,
          `${finding.id}: ${finding.title}`,
          `${context.label}. ${finding.explanation}`
        );

        findingCount++;
      }
    }
  }

  if (count > 0 && findingCount === 0) {
    addMessage(
      container,
      "No password-handling findings in the inspected structure."
    );
  }

  if (snapshot.unassociatedPasswordFields > 0) {
    addMessage(
      container,
      `${snapshot.unassociatedPasswordFields} password field(s) have no associated form. Their submission destinations could not be determined.`
    );
  }

  if (skipped > 0) {
    addMessage(
      container,
      `${skipped} disabled submit-button override(s) skipped.`
    );
  }

  if (
    analysis.results.some(form =>
      form.namedEnabledPasswordFields === null
    )
  ) {
    addMessage(
      container,
      "GET exposure could not be checked because password-field submission metadata is unavailable."
    );
  }
}

async function inspectPage(tab) {
  element("form-status").textContent =
    "Inspecting password-form structure...";

  try {
    const entries = await chrome.scripting.executeScript({
      target: {
        tabId: tab.id,
        frameIds: [0]
      },
      world: "ISOLATED",
      func: collectPasswordForms
    });

    const snapshot = entries.find(
      entry => entry.frameId === 0
    )?.result;

    if (!snapshot) {
      throw new Error("No document snapshot.");
    }

    if (snapshot.pageUrl !== tab.url) {
      element("form-status").textContent =
        "The page changed during inspection. Reopen Diver to analyze the current page.";

      return null;
    }

    const analysis = analyzePasswordForms(
      snapshot.pageUrl,
      snapshot.forms,
      {
        baseUrl: snapshot.baseUrl,
        unassociatedPasswordFields:
          snapshot.unassociatedPasswordFields
      }
    );

    renderFormFindings(snapshot, analysis);

    return analysis;
  } catch {
    element("form-status").textContent =
      "Page inspection unavailable. Reload the page and reopen Diver. Some browser pages restrict inspection.";

    return null;
  }
}

async function initializeDiver() {
  const findings = element("findings");

  element("site-identity").hidden = true;
  element("current-url").textContent = "Checking...";
  element("status").textContent = "Analyzing...";
  element("risk-score").textContent = "N/A";
  element("form-status").textContent =
    "Not inspected: page information unavailable.";

  findings.replaceChildren();

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (!tab?.url) {
      element("current-url").textContent = "Unable to read page";
      element("status").textContent = "Unknown";

      addMessage(
        findings,
        "Diver could not read the current tab's URL."
      );

      return;
    }

    element("current-url").textContent = tab.url;

    const result = analyzeUrl(tab.url);

    if (!result.valid || !result.supported) {
      element("status").textContent = result.valid
        ? "Unsupported page"
        : "Unable to analyze URL";

      element("form-status").textContent =
        "Not inspected: only HTTP and HTTPS pages are supported.";

      addMessage(
        findings,
        "Diver analyzes valid HTTP and HTTPS website URLs only."
      );

      return;
    }

    const identity = getSiteIdentity(tab.url);

    if (identity) {
      element("site-domain-label").textContent = identity.label;
      element("site-domain").textContent = identity.value;
      element("site-identity").hidden = false;
    }

    element("risk-score").textContent = `${result.score} / 100`;
    element("status").textContent = getRiskLevel(result.score);

    for (const finding of result.findings) {
      appendFinding(
        findings,
        `${finding.id}: ${finding.name} (+${finding.score})`,
        finding.evidence
      );
    }

    if (result.findings.length === 0) {
      addMessage(findings, "No URL-based findings");
    }

    const formAnalysis = await inspectPage(tab);

    renderWarning(
      getAutomaticWarning(result, formAnalysis)
    );
  } catch {
    element("site-identity").hidden = true;
    element("status").textContent = "Unable to analyze page";
    element("risk-score").textContent = "N/A";

    findings.replaceChildren();

    addMessage(
      findings,
      "Diver could not complete the analysis. Try reopening the popup."
    );
  }
}

initializeDiver();