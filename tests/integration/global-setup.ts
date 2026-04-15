import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

let server: http.Server;

export default async function globalSetup() {
  // Build the extension before running integration tests
  try {
    execSync("npm run build", { cwd: path.resolve(__dirname, "../../"), stdio: "inherit" });
  } catch {
    console.error("Build failed — integration tests may be stale.");
  }

  // Start a simple static file server for test fixtures
  server = http.createServer((req, res) => {
    const filePath = path.join(__dirname, "fixtures", req.url ?? "/");
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const ext = path.extname(filePath);
      const mime: Record<string, string> = {
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".png": "image/png",
      };
      res.writeHead(200, { "Content-Type": mime[ext] ?? "application/octet-stream" });
      res.end(data);
    });
  });

  await new Promise<void>((resolve) => server.listen(3000, resolve));
  (global as unknown as { __TEST_SERVER__: http.Server }).__TEST_SERVER__ = server;
}
