// Injects the server-rendered app into dist/index.html so crawlers and the
// first paint get real content (menu, prices, address) without waiting for JS.
import { readFile, writeFile, rm } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { render } = await import(pathToFileURL(path.join(root, "dist-ssr/entry-server.js")).href);

for (const [page, rel] of [
  ["home", "dist/index.html"],
  ["speisekarte", "dist/speisekarte/index.html"],
]) {
  const file = path.join(root, rel);
  const html = await readFile(file, "utf8");
  if (!html.includes("<!--app-html-->")) throw new Error(`Placeholder <!--app-html--> missing in ${rel}`);
  await writeFile(file, html.replace("<!--app-html-->", render(page)));
}
await rm(path.join(root, "dist-ssr"), { recursive: true, force: true });
console.log("prerendered dist/index.html, dist/speisekarte/index.html");
