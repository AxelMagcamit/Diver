(() => {
  const state = globalThis.__diverWarningState ??= {
    warned: false
  };

  if (state.watching) return;
  state.watching = true;

  let timer;
  let stopped = false;

  const observed = new WeakSet();
  const relevant = "form,input,button,fieldset,base";

  const options = {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [
      "action",
      "method",
      "formaction",
      "formmethod",
      "type",
      "name",
      "disabled",
      "form",
      "id",
      "href"
    ]
  };

  const observer = new MutationObserver(records => {
    let changed = false;

    for (const record of records) {
      if (record.type === "attributes") {
        if (record.target.matches(relevant)) {
          changed = true;
        }

        continue;
      }

      for (const node of record.addedNodes) {
        if (discover(node)) {
          changed = true;
        }
      }

      for (const node of [
        ...record.addedNodes,
        ...record.removedNodes
      ]) {
        if (
          node.nodeType === 1 &&
          (
            node.matches(relevant) ||
            node.querySelector(relevant) ||
            node.shadowRoot ||
            [...node.querySelectorAll("*")].some(
              host => host.shadowRoot
            )
          )
        ) {
          changed = true;
        }
      }
    }

    if (changed) {
      schedule();
    }
  });

  function observe(root) {
    if (observed.has(root)) {
      return false;
    }

    observed.add(root);
    observer.observe(root, options);

    return true;
  }

  function discover(node) {
    if (
      node.nodeType !== 1 &&
      node.nodeType !== 9 &&
      node.nodeType !== 11
    ) {
      return false;
    }

    let found = false;

    const hosts = node.nodeType === 1
      ? [node]
      : [];

    hosts.push(...node.querySelectorAll("*"));

    for (const host of hosts) {
      const root = host.shadowRoot;

      if (root && observe(root)) {
        found = true;
        discover(root);
      }
    }

    return found;
  }

  function schedule() {
    if (stopped || timer) {
      return;
    }

    timer = setTimeout(async () => {
      timer = undefined;

      try {
        await chrome.runtime.sendMessage({
          type: "DIVER_WARNING_RESCAN"
        });
      } catch {
        stopped = true;
        observer.disconnect();
      }
    }, 1500);
  }

  function refresh() {
    discover(document);
    schedule();
  }

  observe(document);
  refresh();

  addEventListener("pageshow", refresh);
  addEventListener("popstate", refresh);
  addEventListener("hashchange", refresh);
})();