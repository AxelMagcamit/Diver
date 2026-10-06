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

async function initializeDiver() {
  const urlElement = document.getElementById("current-url");
  const statusElement = document.getElementById("status");
  const scoreElement = document.getElementById("risk-score");
  const findingsElement = document.getElementById("findings");

  try {
    const tab = await getCurrentTab();

    if (!tab || !tab.url) {
      urlElement.textContent = "Unable to read page";
      statusElement.textContent = "Unknown";
      return;
    }

    const result = analyzeUrl(tab.url);

    if (!result.valid) {
      urlElement.textContent = tab.url;
      statusElement.textContent = "Unable to analyze URL";
      return;
    }

    urlElement.textContent = result.url;
    scoreElement.textContent = `${result.score} / 100`;
    statusElement.textContent = getRiskLevel(result.score);

    findingsElement.innerHTML = "";

    if (result.findings.length === 0) {
      const item = document.createElement("li");
      item.textContent = "No URL-based findings";
      findingsElement.appendChild(item);
    } else {
      for (const finding of result.findings) {
        const item = document.createElement("li");

        item.textContent =
          `${finding.id}: ${finding.name} (+${finding.score})`;

        findingsElement.appendChild(item);
      }
    }

    console.log("[Diver] Analysis result:", result);

  } catch (error) {
    console.error("[Diver] Error:", error);

    urlElement.textContent = "Error";
    statusElement.textContent = "Unable to analyze page";
  }
}

initializeDiver();