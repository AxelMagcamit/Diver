import { analyzeUrl } from "./engine/analyzer.js";
import { inspectTabFrames } from "./engine/frame-inspection.js";
import { getAutomaticWarning } from "./engine/warning-policy.js";

const generations = new Map();

async function scan(tabId) {
  const generation = (generations.get(tabId) ?? 0) + 1;
  generations.set(tabId, generation);

  let claimedDocumentId;

  try {
    const tab = await chrome.tabs.get(tabId);

    if (
      !tab.active ||
      !/^https?:\/\//i.test(tab.url ?? "")
    ) {
      return;
    }

    if (
      !(await chrome.windows.get(tab.windowId)).focused
    ) {
      return;
    }

    const {
      topDocumentId,
      analysis
    } = await inspectTabFrames(tab);

    const warning = getAutomaticWarning(
      analyzeUrl(tab.url),
      analysis
    );

    if (!warning.warn) return;
    if (generations.get(tabId) !== generation) return;

    const current = await chrome.tabs.get(tabId);

    if (
      !current.active ||
      current.url !== tab.url
    ) {
      return;
    }

    if (
      !(await chrome.windows.get(current.windowId)).focused
    ) {
      return;
    }

    const claims = await chrome.scripting.executeScript({
      target: {
        tabId,
        documentIds: [topDocumentId]
      },
      world: "ISOLATED",
      func: () => {
        const state = globalThis.__diverWarningState ??= {
          warned: false
        };

        if (state.warned) return false;

        state.warned = true;
        return true;
      }
    });

    if (!claims[0]?.result) return;

    claimedDocumentId = topDocumentId;

    if (generations.get(tabId) !== generation) {
      throw new Error("Inspection was superseded.");
    }

    const latest = await chrome.tabs.get(tabId);

    if (
      !latest.active ||
      latest.url !== tab.url ||
      !(await chrome.windows.get(latest.windowId)).focused
    ) {
      throw new Error("The visible page changed.");
    }

    await chrome.action.openPopup({
      windowId: latest.windowId
    });
  } catch {
    if (claimedDocumentId) {
      try {
        await chrome.scripting.executeScript({
          target: {
            tabId,
            documentIds: [claimedDocumentId]
          },
          world: "ISOLATED",
          func: () => {
            if (globalThis.__diverWarningState) {
              globalThis.__diverWarningState.warned = false;
            }
          }
        });
      } catch {
        // The document may already be gone.
      }
    }
  }
}

chrome.runtime.onMessage.addListener(
  (message, sender, respond) => {
    if (
      message?.type !== "DIVER_WARNING_RESCAN" ||
      sender.id !== chrome.runtime.id ||
      !Number.isInteger(sender.frameId) ||
      sender.frameId < 0 ||
      !Number.isInteger(sender.tab?.id) ||
      !sender.documentId
    ) {
      return;
    }

    scan(sender.tab.id).then(() => {
      respond({ done: true });
    });

    return true;
  }
);

chrome.tabs.onActivated.addListener(({ tabId }) => {
  void scan(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, change) => {
  if (change.status === "loading") {
    generations.set(
      tabId,
      (generations.get(tabId) ?? 0) + 1
    );
  }

  if (change.url || change.status === "complete") {
    void scan(tabId);
  }
});

chrome.tabs.onRemoved.addListener(tabId => {
  generations.delete(tabId);
});

chrome.windows.onFocusChanged.addListener(async windowId => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      windowId
    });

    if (tab) void scan(tab.id);
  } catch {
    // The window may have closed.
  }
});