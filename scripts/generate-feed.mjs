import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const indexPath = path.join(root, "content", "index.json");
const feedPath = path.join(root, "feed.xml");

function escape(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const siteUrl = "https://andanadadel5.com";
const siteTitle = "Andanada del 5";
const siteDesc = "Crónicas, análisis y actualidad taurina.";

let posts = [];
try {
  const raw = readFileSync(indexPath, "utf8");
  const json = JSON.parse(raw);
  posts = Array.isArray(json) ? json : (Array.isArray(json.posts) ? json.posts : []);
} catch {}

posts.sort((a, b) => {
  if (!a.date || !b.date) return 0;
  return a.date < b.date ? 1 : -1;
});

const items = posts.slice(0, 20).map((p) => {
  const url = `${siteUrl}/post.html?slug=${encodeURIComponent(p.slug)}`;
  const title = escape(p.title);
  const desc = escape(p.excerpt || "");
  const pubDate = new Date(p.date || Date.now()).toUTCString();
  return `
    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="false">${p.slug}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${desc}</description>
    </item>`;
}).join("");

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${siteTitle}</title>
    <link>${siteUrl}</link>
    <description>${siteDesc}</description>
    ${items}
  </channel>
</rss>
`;

writeFileSync(feedPath, rss, "utf8");
console.log("Feed generado:", feedPath);
