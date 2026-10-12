import { readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function removeBundledComics(webDir) {
  const comicsDir = path.join(webDir, "assets", "wendao", "comics");
  const entries = await readdir(comicsDir, { withFileTypes: true });
  const comicFiles = entries.filter((entry) => entry.isFile());
  const sizes = await Promise.all(
    comicFiles.map(async (entry) => (await stat(path.join(comicsDir, entry.name))).size),
  );
  const beforeBytes = sizes.reduce((sum, size) => sum + size, 0);

  await Promise.all(comicFiles.map((entry) => rm(path.join(comicsDir, entry.name))));
  await rm(comicsDir, { recursive: true });

  return { removedFiles: comicFiles.length, removedBytes: beforeBytes };
}

async function main() {
  const webDir = process.env.WENDAO_IOS_WEB_DIR || path.join(root, "dist", "client");
  const result = await removeBundledComics(webDir);
  if (result.removedFiles < 320 || result.removedBytes === 0) {
    throw new Error(`Unexpected comic bundle: ${result.removedFiles} files, ${result.removedBytes} bytes.`);
  }
  console.log(`Prepared lean iOS web bundle: removed ${result.removedFiles} remote comic files (${(result.removedBytes / 1024 / 1024).toFixed(1)} MiB).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
