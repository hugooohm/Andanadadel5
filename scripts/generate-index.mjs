import { readdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const postsDir = path.join(root, "content", "posts");
const indexPath = path.join(root, "content", "index.json");

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function safeNumber(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function pickMeta(p, slugFromFile) {
  const slug = String(p.slug || slugFromFile || "").trim();
  const title = String(p.title || "").trim();
  const date = String(p.date || "").trim();
  const category = String(p.category || "").trim();
  const image = typeof p.image === "string" ? p.image : "";
  const imageVariants = safeArray(p.imageVariants).map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0);
  const socialImage = typeof p.socialImage === "string" ? p.socialImage : "";
  const imageAlt = typeof p.imageAlt === "string" ? p.imageAlt : "";
  const excerpt = typeof p.excerpt === "string" ? p.excerpt : "";
  const featured = !!p.featured;
  const priority = safeNumber(p.priority, 0);
  const tags = safeArray(p.tags).map((t) => String(t));
  const author = typeof p.author === "string" ? p.author : undefined;

  const meta = {
    slug,
    title,
    date,
    category,
    image,
    imageVariants,
    socialImage,
    imageAlt,
    excerpt,
    featured,
    priority,
    tags
  };
  if (author) meta.author = author;
  return meta;
}

function readPost(file) {
  const full = path.join(postsDir, file);
  try {
    const raw = readFileSync(full, "utf8");
    const json = JSON.parse(raw);
    const slugFromFile = path.basename(file, ".json");
    return pickMeta(json, slugFromFile);
  } catch {
    return null;
  }
}

function sortByDateDesc(a, b) {
  if (!a.date && !b.date) return 0;
  if (!a.date) return 1;
  if (!b.date) return -1;
  const ad = new Date(a.date).getTime();
  const bd = new Date(b.date).getTime();
  if (!Number.isFinite(ad) || !Number.isFinite(bd)) return 0;
  return bd - ad;
}

const files = readdirSync(postsDir).filter((f) => f.endsWith(".json"));
const posts = files.map(readPost).filter(Boolean).sort(sortByDateDesc);

const payload = { posts };
writeFileSync(indexPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
console.log("Índice generado:", indexPath, `(${posts.length} entradas)`);
