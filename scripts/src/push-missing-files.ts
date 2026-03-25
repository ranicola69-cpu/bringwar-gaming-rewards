import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, relative } from "path";

const TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
const OWNER = "ranicola69-cpu";
const REPO = "bringwar-gaming-rewards";
const BASE_URL = `https://api.github.com/repos/${OWNER}/${REPO}`;

if (!TOKEN) { console.error("No token"); process.exit(1); }

const HEADERS = {
  "Authorization": `token ${TOKEN}`,
  "Accept": "application/vnd.github.v3+json",
  "Content-Type": "application/json",
};

const IGNORE = new Set([
  "node_modules", ".git", "dist", ".cache", ".local", "android",
  ".gradle", ".expo", ".expo-shared", "build",
]);

function shouldIgnore(name: string): boolean {
  return IGNORE.has(name) ||
    name.endsWith(".tsbuildinfo") ||
    name.endsWith(".map") ||
    name === "pnpm-lock.yaml";
}

function getAllFiles(dir: string, root: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (shouldIgnore(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...getAllFiles(full, root));
    } else if (stat.size < 300_000) {
      files.push(full);
    }
  }
  return files;
}

async function getFileSha(repoPath: string): Promise<string | null> {
  const res = await fetch(`${BASE_URL}/contents/${repoPath}`, { headers: HEADERS });
  if (!res.ok) return null;
  const data = await res.json() as any;
  return data.sha ?? null;
}

async function pushFile(localPath: string, repoPath: string): Promise<boolean> {
  const content = readFileSync(localPath).toString("base64");
  const sha = await getFileSha(repoPath);
  const body: any = { message: sha ? `Update ${repoPath}` : `Add ${repoPath}`, content };
  if (sha) body.sha = sha;

  const res = await fetch(`${BASE_URL}/contents/${repoPath}`, {
    method: "PUT",
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  const data = await res.json() as any;
  if (res.ok) {
    console.log(`✓ ${repoPath}`);
    return true;
  } else {
    console.error(`✗ ${repoPath}: ${data.message}`);
    return false;
  }
}

const root = new URL("../../", import.meta.url).pathname.replace(/\/$/, "");

// Specific files and directories to push
const TARGETS = [
  "package.json",
  "pnpm-workspace.yaml",
  "tsconfig.json",
  "tsconfig.base.json",
  "lib/db",
  "lib/api-client-react",
  "lib/api-zod",
  "lib/api-spec",
  "lib/integrations-openai-ai-server",
  "scripts",
  "artifacts/api-server",
];

async function main() {
  const filesToPush: { local: string; repo: string }[] = [];

  for (const target of TARGETS) {
    const fullPath = join(root, target);
    if (!existsSync(fullPath)) continue;
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      const files = getAllFiles(fullPath, root);
      for (const f of files) {
        filesToPush.push({ local: f, repo: relative(root, f).replace(/\\/g, "/") });
      }
    } else {
      filesToPush.push({ local: fullPath, repo: target });
    }
  }

  console.log(`Pushing ${filesToPush.length} files...\n`);
  let ok = 0, fail = 0;
  for (let i = 0; i < filesToPush.length; i++) {
    const { local, repo } = filesToPush[i];
    const success = await pushFile(local, repo);
    success ? ok++ : fail++;
    if (i % 5 === 4) await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\nDone: ${ok} pushed, ${fail} failed`);
  console.log("\nNow re-trigger the build at:");
  console.log(`https://github.com/${OWNER}/${REPO}/actions`);
}

main().catch(console.error);
