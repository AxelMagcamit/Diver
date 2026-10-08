import { analyzeUrl } from "../engine/analyzer.js";
import { getSiteIdentity } from "../engine/site-identity.js";
import { collectPasswordForms } from "../engine/form-collector.js";
import { analyzePasswordForms } from "../engine/form-analyzer.js";

function getRiskLevel(score) {
  if (score >= 60) return "High risk";
  if (score >= 30) return "Suspicious";
  if (score > 0) return "Some suspicious signals";
  return "No suspicious URL signals";
}

function showMessage(container, message) {
  const item = document.createElement("li");
  item.textContent = message;
  container.replaceChildren(item);
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

function renderUrlFindings(container, findings) {
  container.replaceChildren();
  if (findings.length === 0) {
    showMessage(container, "No URL-based findings");
    return;
  }
  for (const finding of findings) {
    appendFinding(container,
      `${finding.id}: ${finding.name} (+${finding.score})`, finding.evidence);
  }
}

function renderFormFindings(snapshot, analysis) {
  const status = document.getElementById("form-status");
  const container = document.getElementById("form-findings");
  container.replaceChildren();
  document.getElementById("form-coverage").hidden = false;
  const count = analysis.passwordForms;
  status.textContent = count === 0
    ? "No password forms found in this document."
    : `${count} password ${count === 1 ? "form" : "forms"} inspected.`;
  let findingCount = 0;
  let skipped = 0;
  for (const form of analysis.results) {
    const contexts = [
      { label: `Form ${form.formIndex + 1}, default action`, result: form },
      ...form.submitterResults.map(button => ({
        label: `Form ${form.formIndex + 1}, submit-button override ${button.submitterIndex + 1}`,
        result: button
      }))
    ];
    skipped += form.skippedDisabledSubmitters;
    for (const context of contexts) {
      for (const finding of context.result.findings) {
        appendFinding(container, `${finding.id}: ${finding.title}`,
          `${context.label}. ${finding.explanation}`);
        findingCount++;
      }
    }
  }
  if (count > 0 && findingCount === 0) {
    showMessage(container, "No destination findings in the declared form actions.");
  }
  if (snapshot.unassociatedPasswordFields > 0) {
    const item = document.createElement("li");
    item.textContent = `${snapshot.unassociatedPasswordFields} password field(s) have no associated form. Their submission destinations could not be determined.`;
    container.append(item);
  }
  if (skipped > 0) {
    const item = document.createElement("li");
    item.textContent = `${skipped} disabled submit-button override(s) skipped.`;
    container.append(item);
  }
}

async function inspectPage(tab) {
  const status = document.getElementById("form-status");
  status.textContent = "Inspecting declared password-form destinations...";
  try {
    // Runs once in the top document's isolated world when the popup opens.
    // The collector is self-contained and does not read input values.
    const injections = await chrome.scripting.executeScript({
      target: { tabId: tab.id, frameIds: [0] },
      world: "ISOLATED",
      func: collectPasswordForms
    });
    const snapshot = injections.find(entry => entry.frameId === 0)?.result;
    if (!snapshot) throw new Error("No document snapshot.");
    if (snapshot.pageUrl !== tab.url) {
      status.textContent = "The page changed during inspection. Reopen Diver to analyze the current page.";
      return;
    }
    const analysis = analyzePasswordForms(snapshot.pageUrl, snapshot.forms, {
      baseUrl: snapshot.baseUrl
    });
    renderFormFindings(snapshot, analysis);
    // Keep the snapshot in memory only; do not log or save page actions.
  } catch {
    status.textContent = "Page inspection unavailable. Reload the page and reopen Diver. Some browser pages restrict inspection.";
  }
}

async function initializeDiver() {
  const url = document.getElementById("current-url");
  const status = document.getElementById("status");
  const score = document.getElementById("risk-score");
  const findings = document.getElementById("findings");
  const identityElement = document.getElementById("site-identity");
  const formStatus = document.getElementById("form-status");
  identityElement.hidden = true;
  url.textContent = "Checking...";
  status.textContent = "Analyzing...";
  score.textContent = "N/A";
  formStatus.textContent = "Not inspected: page information unavailable.";
  findings.replaceChildren();
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (!tab?.url) {
      url.textContent = "Unable to read page";
      status.textContent = "Unknown";
      showMessage(findings, "Diver could not read the current tab's URL.");
      return;
    }
    url.textContent = tab.url;
    const result = analyzeUrl(tab.url);
    if (!result.valid) {
      status.textContent = "Unable to analyze URL";
      showMessage(findings, "The current tab does not have a valid URL.");
      return;
    }
    if (!result.supported) {
      status.textContent = "Unsupported page";
      formStatus.textContent = "Not inspected: only HTTP and HTTPS pages are supported.";
      showMessage(findings, "Diver analyzes HTTP and HTTPS website URLs only.");
      return;
    }
    const identity = getSiteIdentity(tab.url);
    if (identity) {
      document.getElementById("site-domain-label").textContent = identity.label;
      document.getElementById("site-domain").textContent = identity.value;
      identityElement.hidden = false;
    }
    score.textContent = `${result.score} / 100`;
    status.textContent = getRiskLevel(result.score);
    renderUrlFindings(findings, result.findings);
    await inspectPage(tab);
  } catch {
    identityElement.hidden = true;
    status.textContent = "Unable to analyze page";
    score.textContent = "N/A";
    showMessage(findings, "Diver could not complete the analysis. Try reopening the popup.");
  }
}

initializeDiver();
