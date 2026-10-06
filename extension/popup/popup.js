import { analyzeUrl } from "../engine/analyzer.js";

async function getCurrentTab() {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  return tabs[0];
}

function getRiskLevel(score) {
  if (score >= 60) {
    return "High risk";
  }

  if (score >= 30) {
    return "Suspicious";
  }

  if (score > 0) {
    return "Some suspicious signals";
  }

  return "No suspicious URL signals";
}

function showMessage(container, message) {
  const item = document.createElement("li");
  item.textContent = message;
  container.replaceChildren(item);
}

function renderFindings(container, findings) {
  container.replaceChildren();

  if (findings.length === 0) {
    showMessage(container, "No URL-based findings");
    return;
  }

  for (const finding of findings) {
    const item = document.createElement("li");

    const title = document.createElement("strong");
    title.textContent =
      `${finding.id}: ${finding.name} (+${finding.score})`;

    const explanation = document.createElement("p");
    explanation.textContent = finding.evidence;

    item.appendChild(title);
    item.appendChild(explanation);
    container.appendChild(item);
  }
}

async function initializeDiver() {
  const urlElement = document.getElementById("current-url");
  const statusElement = document.getElementById("status");
  const scoreElement = document.getElementById("risk-score");
  const findingsElement = document.getElementById("findings");

  urlElement.textContent = "Checking...";
  statusElement.textContent = "Analyzing...";
  scoreElement.textContent = "N/A";
  findingsElement.replaceChildren();

  try {
    const tab = await getCurrentTab();

    if (!tab || !tab.url) {
      urlElement.textContent = "Unable to read page";
      statusElement.textContent = "Unknown";

      showMessage(
        findingsElement,
        "Diver could not read the current tab's URL."
      );

      return;
    }

    urlElement.textContent = tab.url;

    let pageUrl;

    try {
      pageUrl = new URL(tab.url);
    } catch {
      statusElement.textContent = "Unable to analyze URL";

      showMessage(
        findingsElement,
        "The current tab does not have a valid URL."
      );

      return;
    }

    const isWebPage =
      pageUrl.protocol === "http:" ||
      pageUrl.protocol === "https:";

    if (!isWebPage) {
      statusElement.textContent = "Unsupported page";

      showMessage(
        findingsElement,
        "Diver's popup analyzes HTTP and HTTPS website URLs only."
      );

      return;
    }

    const result = analyzeUrl(tab.url);

    if (!result.valid) {
      statusElement.textContent = "Unable to analyze URL";

      showMessage(
        findingsElement,
        "Diver could not analyze this URL."
      );

      return;
    }

    scoreElement.textContent = `${result.score} / 100`;
    statusElement.textContent = getRiskLevel(result.score);

    renderFindings(findingsElement, result.findings);

    console.log("[Diver] Analysis result:", result);
  } catch (error) {
    console.error("[Diver] Error:", error);

    statusElement.textContent = "Unable to analyze page";
    scoreElement.textContent = "N/A";

    showMessage(
      findingsElement,
      "Diver could not complete the analysis. Try reopening the popup."
    );
  }
}

initializeDiver();