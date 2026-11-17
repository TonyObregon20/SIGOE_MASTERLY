import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Report locations only; never echo credentials into terminal logs.
export function scanText(file, text) {
  const findings = [];
  if (/(^|\/)\.env(?:\..+)?$/.test(file) && !file.endsWith('.env.example')) {
    findings.push({ file, line: 1, rule: 'Archivo de entorno privado' });
  }
  const rules = [
    ['Conexión con credenciales', /\b(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql):\/\/[^\s/"']+:[^\s/"']+@/],
    ['Clave privada', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
    ['Token de proveedor', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|AKIA[A-Z0-9]{16}|sk-(?:proj-)?[A-Za-z0-9_-]{30,})\b/],
    ['JWT publicado', /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/],
    ['Secreto literal', /\b(?:JWT_SECRET|API_KEY|BOOTSTRAP_ADMIN_PASSWORD)\b\s*(?:=|:)\s*["'][^"'\r\n]{8,}["']/],
  ];
  text.split(/\r?\n/).forEach((line, i) => {
    for (const [rule, expression] of rules) {
      if (expression.test(line)) findings.push({ file, line: i + 1, rule });
    }
  });
  return findings;
}

export function checkRepository() {
  const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
  const findings = [];
  for (const file of new Set(files)) {
    const absolute = path.join(root, file);
    if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) continue;
    const content = fs.readFileSync(absolute);
    if (content.includes(0)) continue;
    findings.push(...scanText(file, content.toString('utf8')));
  }
  return findings;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const findings = checkRepository();
  for (const finding of findings) console.error(`${finding.file}:${finding.line} — ${finding.rule}`);
  if (findings.length) process.exitCode = 1;
  else console.log('Sin secretos detectados en los archivos actuales publicables. No incluye el historial.');
}
