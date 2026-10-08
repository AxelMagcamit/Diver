import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const projectRoot = new URL("../../", import.meta.url);

function resource(path, type) {
  return {
    file: new URL(path, projectRoot),
    type
  };
}

const htmlType = "text/html; charset=utf-8";
const jsType = "text/javascript; charset=utf-8";

const routes = new Map([
  ["/popup-demo", resource("evaluation/node/fixtures/form-popup-demo.html", htmlType)],
  [
    "/",
    resource(
      "evaluation/node/fixtures/form-collector-test.html",
      htmlType
    )
  ],
  [
    "/integration",
    resource(
      "evaluation/node/fixtures/form-integration-test.html",
      htmlType
    )
  ],
  [
    "/form-collector.js",
    resource(
      "extension/engine/form-collector.js",
      jsType
    )
  ],
  [
    "/extension/engine/form-collector.js",
    resource(
      "extension/engine/form-collector.js",
      jsType
    )
  ],
  [
    "/extension/engine/form-analyzer.js",
    resource(
      "extension/engine/form-analyzer.js",
      jsType
    )
  ],
  [
    "/extension/engine/site-identity.js",
    resource(
      "extension/engine/site-identity.js",
      jsType
    )
  ],
  [
    "/extension/vendor/tldts-7.4.16.js",
    resource(
      "extension/vendor/tldts-7.4.16.js",
      jsType
    )
  ]
]);

const server = createServer(async (request, response) => {
  const route = routes.get(request.url);

  if (request.method !== "GET" || !route) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  try {
    const contents = await readFile(route.file);

    response.writeHead(200, {
      "Content-Type": route.type,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    });

    response.end(contents);
  } catch (error) {
    console.error(error.message);
    response.writeHead(500);
    response.end("Unable to load the test file.");
  }
});

server.on("error", error => {
  console.error(`Test server failed: ${error.message}`);
  process.exitCode = 1;
});

server.listen(8765, "127.0.0.1", () => {
  console.log("Collector:   http://127.0.0.1:8765/");
  console.log("Integration: http://127.0.0.1:8765/integration");
  console.log("Popup demo:  http://127.0.0.1:8765/popup-demo");
  console.log("Press Ctrl+C to stop.");
});