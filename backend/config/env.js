import dotenv from "dotenv";
import path from "node:path";

const cwd = process.cwd();
const candidates = [
  path.resolve(cwd, ".env"),
  path.resolve(cwd, "backend/.env"),
  path.resolve(cwd, "../.env"),
  path.resolve(cwd, "../backend/.env")
];

for (const envPath of candidates) {
  dotenv.config({ path: envPath, override: false });
}
