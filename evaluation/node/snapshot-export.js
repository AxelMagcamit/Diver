import { collectPasswordForms } from "/extension/engine/form-collector.js";
import { analyzePasswordForms } from "/extension/engine/form-analyzer.js";
import { sanitizeFormSnapshot } from "/sanitize-form-snapshot.js";

const selector = document.getElementById("case");
const fixture = document.getElementById("fixture");
const exportButton = document.getElementById("export");
const status = document.getElementById("status");
const preview = document.getElementById("preview");
const ids = Array.from(selector.options, option => option.value);

document.addEventListener("submit", event => event.preventDefault(), true);

function password(container) {
  const label = document.createElement("label");
  label.htmlFor = "demo-password";
  label.textContent = "Demo password — leave empty";
  const input = document.createElement("input");
  input.id = "demo-password";
  input.type = "password";
  input.autocomplete = "off";
  container.append(label, input);
}

function render(id) {
  fixture.replaceChildren();
  if (id === "no-password-forms") {
    fixture.textContent = "No password forms in this example.";
    return;
  }
  if (id === "unassociated-field") {
    password(fixture);
    return;
  }
  const form = document.createElement("form");
  form.method = "post";
  form.setAttribute("action", id === "external-https"
    ? "https://collector.example.net/private-session?token=synthetic-token"
    : id === "unsupported-action" ? "mailto:demo@example.org" : "/session");
  password(form);
  const button = document.createElement("button");
  button.type = "submit";
  button.textContent = "Demo submit — prevented";
  if (id === "button-override") {
    button.setAttribute("formaction", "https://identity.example.org/private-session?token=synthetic-token");
  }
  form.append(button);
  fixture.append(form);
}

function destinationProperties(snapshot) {
  const analysis = analyzePasswordForms(snapshot.pageUrl, snapshot.forms, {
    baseUrl: snapshot.baseUrl,
    unassociatedPasswordFields: snapshot.unassociatedPasswordFields
  });
  function properties(result) {
    return {
      method: result.method,
      relationship: result.relationship,
      destinationOrigin: result.destinationOrigin,
      destinationSite: result.destinationSite,
      findingIds: result.findings.map(finding => finding.id)
    };
  }
  return JSON.stringify({
    pageSite: analysis.pageSite,
    passwordForms: analysis.passwordForms,
    pageFindingIds: analysis.pageFindings.map(finding => finding.id),
    unassociatedPasswordFields: snapshot.unassociatedPasswordFields,
    results: analysis.results.map(form => ({
      ...properties(form),
      skippedDisabledSubmitters: form.skippedDisabledSubmitters,
      submitterResults: form.submitterResults.map(properties)
    }))
  });
}

exportButton.addEventListener("click", () => {
  const previous = selector.value;
  exportButton.disabled = true;
  preview.hidden = true;
  try {
    const records = ids.map(id => {
      render(id);
      const raw = collectPasswordForms();
      const snapshot = sanitizeFormSnapshot(raw);
      if (destinationProperties(raw) !== destinationProperties(snapshot)) {
        throw new Error("Sanitization changed destination analysis.");
      }
      return { id, inspectionStatus: "available", snapshot };
    });
    const dataset = {
      schemaVersion: 1,
      source: "synthetic",
      collection: {
        method: "browser-dom",
        environment: "controlled-local-fixtures",
        collectedAt: new Date().toISOString(),
        note: "Lossy export: URL origins retained; paths, queries, fragments and credentials removed."
      },
      records
    };
    const text = JSON.stringify(dataset, null, 2) + "\n";
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "page-structures-export.json";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    preview.textContent = text;
    preview.hidden = false;
    status.textContent = "Exported 6 DOM-collected synthetic records. Destination properties matched before and after sanitization.";
  } catch {
    status.textContent = "Export failed. No completed dataset was prepared. Check that the local fixture files are current.";
  } finally {
    render(previous);
    exportButton.disabled = false;
  }
});

selector.addEventListener("change", () => {
  render(selector.value);
  preview.hidden = true;
  status.textContent = "Ready. Close and reopen Diver if inspecting the selected example.";
});

if (location.protocol !== "http:" || location.hostname !== "127.0.0.1") {
  status.textContent = "Use the local server at http://127.0.0.1:8765/snapshot-export.";
} else {
  render(selector.value);
  exportButton.disabled = false;
  status.textContent = "Ready to collect and export the six local examples.";
}
