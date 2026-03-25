import { readFileSync } from "fs";

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

async function getFileSha(path: string): Promise<string | null> {
  const res = await fetch(`${BASE_URL}/contents/${path}`, { headers: HEADERS });
  if (!res.ok) return null;
  const data = await res.json() as any;
  return data.sha ?? null;
}

async function updateFile(localPath: string, repoPath: string, message: string) {
  const content = readFileSync(localPath).toString("base64");
  const sha = await getFileSha(repoPath);

  const body: any = { message, content };
  if (sha) body.sha = sha;

  const res = await fetch(`${BASE_URL}/contents/${repoPath}`, {
    method: "PUT",
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  const data = await res.json() as any;
  if (res.ok) {
    console.log(`✓ [${res.status}] ${repoPath}`);
  } else {
    console.error(`✗ [${res.status}] ${repoPath}: ${data.message}`);
  }
}

// Path to workspace root (two levels up from scripts/src/)
const root = new URL("../../", import.meta.url).pathname.replace(/\/$/, "");

async function main() {
  console.log("Updating changed files in GitHub repo...\n");

  await updateFile(
    `${root}/.github/workflows/build-apk.yml`,
    ".github/workflows/build-apk.yml",
    "Update APK build workflow - add Capacitor from package.json"
  );

  await updateFile(
    `${root}/artifacts/earnflow/package.json`,
    "artifacts/earnflow/package.json",
    "Add @capacitor/core, @capacitor/android, @capacitor/cli dependencies"
  );

  await updateFile(
    `${root}/artifacts/earnflow/capacitor.config.ts`,
    "artifacts/earnflow/capacitor.config.ts",
    "Add Capacitor config for BRINGWAR Gaming Rewards Android APK"
  );

  console.log("\nDone! View your repo at:");
  console.log(`https://github.com/${OWNER}/${REPO}`);
  console.log(`\nTo build the APK, go to:`);
  console.log(`https://github.com/${OWNER}/${REPO}/actions`);
  console.log(`Click "Build & Release APK" → "Run workflow"`);
}

main().catch(console.error);
