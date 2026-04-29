import { cpSync, mkdirSync, writeFileSync, rmSync } from "fs";

rmSync("deploy", { recursive: true, force: true });
mkdirSync("deploy/playground", { recursive: true });
mkdirSync("deploy/mindmap", { recursive: true });

cpSync("example/playground/dist", "deploy/playground", { recursive: true });
cpSync("example/mindmap/dist", "deploy/mindmap", { recursive: true });

writeFileSync(
  "deploy/index.html",
  `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>auto-tree-layout</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #111; color: #eee; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; gap: 16px; }
    h1 { font-size: 1.5rem; margin-bottom: 8px; }
    a { display: inline-block; padding: 12px 28px; border-radius: 8px; background: #7c4dff; color: #fff; text-decoration: none; font-size: 1rem; }
    a:hover { background: #9e6dff; }
  </style>
</head>
<body>
  <h1>auto-tree-layout</h1>
  <a href="/playground/">Playground</a>
  <a href="/mindmap/">Mindmap</a>
</body>
</html>
`,
);

console.log("deploy/ ready");
