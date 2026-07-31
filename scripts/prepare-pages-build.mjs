#!/usr/bin/env node
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist", "client");
const domain = "wendao.wonderelian.com";
const adminOutput = path.join(output, "admin");

mkdirSync(adminOutput, { recursive: true });
copyFileSync(path.join(output, "index.html"), path.join(adminOutput, "index.html"));
copyFileSync(path.join(output, "index.html"), path.join(output, "404.html"));
writeFileSync(path.join(output, "CNAME"), `${domain}\n`);
console.log(`Prepared GitHub Pages build for https://${domain}/ and /admin/.`);
