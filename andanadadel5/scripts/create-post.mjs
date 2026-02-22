import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const contentDir = path.join(root, "content");
const postsDir = path.join(contentDir, "posts");
const indexPath = path.join(contentDir, "index.json");
const mediaDir = path.join(root, "media", "posts");

const rawArgs = process.argv.slice(2);
const flagArgs = rawArgs.filter((a) => a.startsWith("--"));
const args = rawArgs.filter((a) => !a.startsWith("--"));
if (args.length < 2) {
  console.log("Uso: node scripts/create-post.mjs <slug> <title> [category] [date] [excerpt] [featured:true|false] [variantsCSV]");
  process.exit(1);
}

const slug = String(args[0]).trim();
const title = String(args[1]).trim();
const category = args[2] ? String(args[2]).trim() : "Actualidad";
const date = args[3] ? String(args[3]).trim() : new Date().toISOString().slice(0, 10);
const excerpt = args[4] ? String(args[4]).trim() : "";
let featured = false;
let variantsArgIndex = 5;
if (args[5]) {
  const val = String(args[5]).toLowerCase();
  if (val === "true" || val === "false") {
    featured = val === "true";
    variantsArgIndex = 6;
  }
}
let variants = [480, 720, 1200];
if (args[variantsArgIndex]) {
  variants = String(args[variantsArgIndex])
    .split(",")
    .map((v) => parseInt(v, 10))
    .filter((n) => Number.isFinite(n) && n > 0);
}
if ((category === "Crónicas" || featured) && variants.indexOf(1600) === -1) {
  variants.push(1600);
}

let overwriteContent = false;
let contentText = null;
let contentFile = null;
for (const f of flagArgs) {
  if (f === "--overwrite-content") overwriteContent = true;
  else if (f.startsWith("--content-text=")) contentText = f.slice("--content-text=".length);
  else if (f.startsWith("--content-file=")) contentFile = f.slice("--content-file=".length);
}
if (overwriteContent && contentFile && !contentText) {
  try {
    contentText = readFileSync(path.resolve(contentFile), "utf8");
  } catch {}
}

mkdirSync(postsDir, { recursive: true });
mkdirSync(mediaDir, { recursive: true });

const baseImage = `https://andanadadel5.com/media/posts/${slug}.jpg`;
const socialImage = `https://andanadadel5.com/media/posts/${slug}-og.jpg`;

const postPath = path.join(postsDir, `${slug}.json`);
if (existsSync(postPath)) {
  let prevRaw = "";
  try {
    prevRaw = readFileSync(postPath, "utf8");
  } catch {}
  let prev = {};
  try {
    prev = JSON.parse(prevRaw);
  } catch {
    prev = {};
  }
  const updated = {
    slug,
    title,
    date,
    category,
    image: baseImage,
    imageVariants: variants,
    socialImage,
    imageAlt: typeof prev.imageAlt === "string" ? prev.imageAlt : "",
    imageCaption: typeof prev.imageCaption === "string" ? prev.imageCaption : "",
    excerpt: excerpt || prev.excerpt || "",
    featured: typeof prev.featured === "boolean" ? (prev.featured || featured) : featured,
    priority: typeof prev.priority === "number" ? prev.priority : 0,
    tags: Array.isArray(prev.tags) ? Array.from(new Set([...prev.tags, category])) : [category],
    contentHtml: overwriteContent
      ? (contentText || prev.contentHtml || "<p>Contenido del artículo...</p>")
      : (typeof prev.contentHtml === "string" ? prev.contentHtml : "<p>Contenido del artículo...</p>"),
  };
  writeFileSync(postPath, JSON.stringify(updated, null, 2) + "\n", "utf8");
  console.log("Actualizado post:", postPath);
} else {
  const postData = {
    slug,
    title,
    date,
    category,
    image: baseImage,
    imageVariants: variants,
    socialImage,
    webpEnabled: false,
    imageAlt: "",
    imageCaption: "",
    excerpt,
    featured,
    priority: 0,
    tags: [category],
    contentHtml: overwriteContent ? (contentText || "<p>Contenido del artículo...</p>") : "<p>Contenido del artículo...</p>",
  };
  if (flagArgs.includes("--webp")) {
    postData.webpEnabled = true;
  }
  writeFileSync(postPath, JSON.stringify(postData, null, 2) + "\n", "utf8");
  console.log("Creado post:", postPath);
}

let indexRaw = "{}";
try {
  indexRaw = readFileSync(indexPath, "utf8");
} catch {}
let indexJson;
try {
  indexJson = JSON.parse(indexRaw);
} catch {
  indexJson = {};
}
let postsArr = Array.isArray(indexJson) ? indexJson : Array.isArray(indexJson.posts) ? indexJson.posts : [];
const existingIndex = postsArr.findIndex((p) => p && p.slug === slug);
if (existingIndex === -1) {
  const entry = {
    slug,
    title,
    date,
    category,
    image: baseImage,
    imageVariants: variants,
    socialImage,
    webpEnabled: flagArgs.includes("--webp"),
    imageAlt: "",
    excerpt,
    featured,
    priority: 0,
    tags: [category],
  };
  postsArr.unshift(entry);
  if (Array.isArray(indexJson)) {
    writeFileSync(indexPath, JSON.stringify(postsArr, null, 2) + "\n", "utf8");
  } else {
    writeFileSync(indexPath, JSON.stringify({ posts: postsArr }, null, 2) + "\n", "utf8");
  }
  console.log("Actualizado índice (añadido):", indexPath);
} else {
  const prev = postsArr[existingIndex] || {};
  const updated = {
    slug,
    title,
    date,
    category,
    image: baseImage,
    imageVariants: variants,
    socialImage,
    webpEnabled: flagArgs.includes("--webp") ? true : (typeof prev.webpEnabled === "boolean" ? prev.webpEnabled : false),
    imageAlt: prev.imageAlt || "",
    excerpt,
    featured,
    priority: typeof prev.priority === "number" ? prev.priority : 0,
    tags: Array.isArray(prev.tags) ? Array.from(new Set([...prev.tags, category])) : [category],
  };
  postsArr[existingIndex] = updated;
  if (Array.isArray(indexJson)) {
    writeFileSync(indexPath, JSON.stringify(postsArr, null, 2) + "\n", "utf8");
  } else {
    writeFileSync(indexPath, JSON.stringify({ posts: postsArr }, null, 2) + "\n", "utf8");
  }
  console.log("Actualizado índice (modificado):", indexPath);
}

const mediaBasePath = path.join(mediaDir, `${slug}.jpg`);
if (!existsSync(mediaBasePath)) {
  writeFileSync(mediaBasePath, "placeholder\n", "utf8");
  console.log("Creada imagen base:", mediaBasePath);
}
for (const w of variants) {
  const variantPath = path.join(mediaDir, `${slug}@${w}.jpg`);
  if (!existsSync(variantPath)) {
    writeFileSync(variantPath, "placeholder\n", "utf8");
    console.log("Creada variante:", variantPath);
  }
}
const socialPath = path.join(mediaDir, `${slug}-og.jpg`);
if (!existsSync(socialPath)) {
  writeFileSync(socialPath, "placeholder\n", "utf8");
  console.log("Creada imagen social:", socialPath);
}

const makeWebp = flagArgs.includes("--webp");
if (makeWebp) {
  const webpBase = path.join(mediaDir, `${slug}.webp`);
  if (!existsSync(webpBase)) {
    writeFileSync(webpBase, "placeholder\n", "utf8");
    console.log("Creada imagen base WEBP:", webpBase);
  }
  for (const w of variants) {
    const webpVar = path.join(mediaDir, `${slug}@${w}.webp`);
    if (!existsSync(webpVar)) {
      writeFileSync(webpVar, "placeholder\n", "utf8");
      console.log("Creada variante WEBP:", webpVar);
    }
  }
  const webpSocial = path.join(mediaDir, `${slug}-og.webp`);
  if (!existsSync(webpSocial)) {
    writeFileSync(webpSocial, "placeholder\n", "utf8");
    console.log("Creada imagen social WEBP:", webpSocial);
  }
}

console.log("Listo. Ejecuta: post.html?slug=" + encodeURIComponent(slug));
