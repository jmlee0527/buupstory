const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const startPort = Number(process.env.PORT || 3000);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml"
};

function resolveFile(urlPath) {
  const safePath = decodeURIComponent(urlPath.split("?")[0]).replace(/^\/+/, "");
  let target = path.join(root, safePath);
  if (urlPath === "/" || safePath.endsWith("/")) target = path.join(root, safePath, "index.html");
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, "index.html");
  if (!fs.existsSync(target)) target = path.join(root, "404.html");
  return target;
}

const server = http.createServer((req, res) => {
    const file = resolveFile(req.url || "/");
    const ext = path.extname(file);
    res.writeHead(path.basename(file) === "404.html" ? 404 : 200, {
      "Content-Type": types[ext] || "application/octet-stream"
    });
    fs.createReadStream(file).pipe(res);
  });

function listen(port) {
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && port < startPort + 20) {
      console.log(`Port ${port} is already in use. Trying ${port + 1}...`);
      listen(port + 1);
      return;
    }

    throw error;
  });

  server.listen(port, () => {
    console.log(`AI 활용 연구소 dev server: http://localhost:${port}`);
  });
}

listen(startPort);
