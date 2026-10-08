// Minimal static file server for Railway — zero dependencies.
// Serves only the website files (index.html, style.css, script.js, assets/),
// never server.js, package.json or .git.
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const ALLOWED_FILES = new Set(["/index.html", "/style.css", "/script.js"]);
const ALLOWED_PREFIXES = ["/assets/"];

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

function send(res, status, headers, body) {
  res.writeHead(status, { ...SECURITY_HEADERS, ...headers });
  res.end(body);
}

const server = http.createServer((req, res) => {
  // Health check for Railway
  if (req.url === "/health") {
    return send(res, 200, { "Content-Type": "text/plain" }, "ok");
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 405, { Allow: "GET, HEAD" }, "Method Not Allowed");
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    return send(res, 400, { "Content-Type": "text/plain" }, "Bad Request");
  }

  if (pathname === "/") pathname = "/index.html";

  const allowed =
    ALLOWED_FILES.has(pathname) ||
    ALLOWED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!allowed) {
    return send(res, 404, { "Content-Type": "text/plain" }, "Not found");
  }

  // Prevent path traversal
  const filePath = path.normalize(path.join(ROOT, pathname));
  if (!filePath.startsWith(ROOT + path.sep)) {
    return send(res, 403, { "Content-Type": "text/plain" }, "Forbidden");
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      return send(res, 404, { "Content-Type": "text/plain" }, "Not found");
    }
    const ext = path.extname(filePath).toLowerCase();
    send(
      res,
      200,
      {
        "Content-Type": TYPES[ext] || "application/octet-stream",
        "Cache-Control":
          ext === ".html" ? "no-cache" : "public, max-age=86400",
      },
      req.method === "HEAD" ? undefined : data
    );
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Gratitude Garden running on port ${PORT}`);
});
