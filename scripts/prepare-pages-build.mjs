#!/usr/bin/env node
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist", "client");
const textExtensions = new Set([".html", ".css", ".js", ".json", ".webmanifest"]);
const repositoryBase = "/wendao-mobile/assets/";

function visit(directory) {
  for (const entry of readdirSync(directory)) {
    const file = path.join(directory, entry);
    if (statSync(file).isDirectory()) {
      visit(file);
      continue;
    }

    if (!textExtensions.has(path.extname(file))) continue;
    const source = readFileSync(file, "utf8");
    const patched = source.replace(/([("'=])\/assets\//g, `$1${repositoryBase}`);
    if (patched !== source) writeFileSync(file, patched);
  }
}

visit(output);
console.log("Prepared GitHub Pages build at /wendao-mobile/.");
