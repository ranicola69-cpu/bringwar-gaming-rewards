import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
const OWNER = "ranicola69-cpu";
const REPO = "bringwar-gaming-rewards";
const BASE_URL = `https://api.github.com/repos/${OWNER}/${REPO}`;

if (!TOKEN) {
  console.error("GITHUB_PERSONAL_ACCESS_TOKEN not set");
  process.exit(1);
}

const headers = {
  "Authorization": `token ${TOKEN}`,
  "Accept": "application/vnd.github.v3+json",
  "Content-Type": "application/json",
};

const IGNORE = new Set([
  "node_modules", ".git", "dist", ".cache", ".local",
  "pnpm-lock.yaml", ".DS_Store", "android", ".gradle",
]);

function shouldIgnore(name: string): boolean {
  return IGNORE.has(name) || name.endsWith(".tsbuildinfo") || name.endsWith(".map");
}

function getAllFiles(dir: string, root: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (shouldIgnore(entry)) continue;
    const full = join(dir, entry);
    const rel = relative(root, full);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...getAllFiles(full, root));
    } else if (stat.size < 500_000) { // skip files >500KB
      files.push(full);
    }
  }
  return files;
}

async function apiGet(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  if (!res.ok) return null;
  return res.json();
}

async function pushFile(filePath: string, repoPath: string) {
  const content = readFileSync(filePath);
  const b64 = content.toString("base64");

  // Check if file already exists (to get sha for update)
  let sha: string | undefined;
  const existing = await apiGet(`/contents/${repoPath}`);
  if (existing && typeof existing === "object" && "sha" in existing) {
    sha = (existing as any).sha;
  }

  const body: any = {
    message: `Add ${repoPath}`,
    content: b64,
  };
  if (sha) body.sha = sha;

  const res = await fetch(`${BASE_URL}/contents/${repoPath}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json() as any;
  if (res.ok) {
    console.log(`✓ ${repoPath}`);
  } else {
    console.error(`✗ ${repoPath}: ${data.message}`);
  }
}

async function main() {
  // Always use the workspace root (two levels up from scripts/)
  const root = new URL("../../", import.meta.url).pathname.replace(/\/$/, "");
  const files = getAllFiles(root, root);

  console.log(`Pushing ${files.length} files to github.com/${OWNER}/${REPO}...`);

  // Push in batches to avoid rate limiting
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const repoPath = relative(root, file).replace(/\\/g, "/");
    await pushFile(file, repoPath);
    // Small delay to avoid rate limiting
    if (i % 10 === 9) await new Promise(r => setTimeout(r, 500));
  }

  console.log("\nDone! Repo: https://github.com/DPHMS/bringwar-gaming-rewards");
  console.log("\nTo trigger APK build, go to:");
  console.log("https://github.com/DPHMS/bringwar-gaming-rewards/actions");
  console.log('And click "Run workflow" on the "Build & Release APK" workflow.');
}

main().catch(console.error);
