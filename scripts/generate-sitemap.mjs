import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const indexPath = path.join(root, "content", "index.json");
const sitemapPath = path.join(root, "sitemap.xml");

const siteUrl = "https://andanadadel5.com";
const staticUrls = [
  { loc: `${siteUrl}/`, priority: 1.0 },
  { loc: `${siteUrl}/archive.html`, priority: 0.8 },
  { loc: `${siteUrl}/contacto.html`, priority: 0.5 },
  { loc: `${siteUrl}/aviso-legal.html`, priority: 0.2 },
  { loc: `${siteUrl}/privacidad.html`, priority: 0.2 },
  { loc: `${siteUrl}/cookies.html`, priority: 0.2 },
  { loc: `${siteUrl}/category.html?cat=Actualidad`, priority: 0.6 },
  { loc: `${siteUrl}/category.html?cat=Ferias`, priority: 0.6 },
  { loc: `${siteUrl}/category.html?cat=Crónicas`, priority: 0.6 },
  { loc: `${siteUrl}/category.html?cat=Entrevistas`, priority: 0.6 },
  { loc: `${siteUrl}/category.html?cat=Festejo Popular`, priority: 0.6 },
  { loc: `${siteUrl}/category.html?cat=Opinión`, priority: 0.6 },
  { loc: `${siteUrl}/category.html?cat=Toreros`, priority: 0.6 },
  { loc: `${siteUrl}/category.html?cat=Ganaderías`, priority: 0.6 },
  { loc: `${siteUrl}/agenda.html`, priority: 0.6 }
];

let posts = [];
try {
  const raw = readFileSync(indexPath, "utf8");
  const json = JSON.parse(raw);
  posts = Array.isArray(json) ? json : (Array.isArray(json.posts) ? json.posts : []);
} catch {}

function toXml(u) {
  const lastmod = u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : "";
  const priority = typeof u.priority === "number" ? `<priority>${u.priority.toFixed(1)}</priority>` : "";
  return `  <url>\n    <loc>${u.loc}</loc>\n${priority ? "    " + priority + "\n" : ""}${lastmod ? "    " + lastmod + "\n" : ""}  </url>`;
}

const postUrls = posts.map((p) => ({
  loc: `${siteUrl}/post.html?slug=${encodeURIComponent(p.slug)}`,
  priority: 0.7,
  lastmod: p.date || ""
}));

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${staticUrls.map(toXml).join("\n")}\n${postUrls.map(toXml).join("\n")}\n</urlset>\n`;
writeFileSync(sitemapPath, xml, "utf8");
console.log("Sitemap generado:", sitemapPath);
