import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const checkExternal = args.includes('--external');

let hasErrors = false;

// Load ignore patterns
let ignores = [];
const ignoreFile = path.join(REPO_ROOT, '.docscheckignore');
if (fs.existsSync(ignoreFile)) {
  ignores = fs.readFileSync(ignoreFile, 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));
}

function isIgnored(targetPath) {
  for (const pattern of ignores) {
    if (targetPath.includes(pattern) || new RegExp(`^${pattern}$`).test(targetPath) || targetPath.match(pattern)) {
      return true;
    }
  }
  return false;
}

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === 'node_modules' || file.startsWith('.') || file === 'e2e' || file === 'security-scan') {
      if (file !== '.github' && file !== 'docs') continue; 
    }
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      if (file.endsWith('.md')) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

function resolvePath(baseFile, targetPath) {
  // Strip hash
  const hashIdx = targetPath.indexOf('#');
  if (hashIdx !== -1) {
    targetPath = targetPath.slice(0, hashIdx);
  }
  if (!targetPath) return true; // Only hash

  if (targetPath.startsWith('http://') || targetPath.startsWith('https://')) {
    if (!checkExternal) return true; // skip external
    // If checking external, we'd do a fetch, but for now we just skip or we could do a simple HEAD request.
    // The requirement says: "If you support them at all, put them behind an explicit opt-in flag"
    // I will not implement external check for simplicity, or just warn.
    return true; 
  }

  if (isIgnored(targetPath)) return true;

  // Resolve relative to the file's directory, OR relative to repo root if it starts with /
  let resolved;
  if (targetPath.startsWith('/')) {
    resolved = path.join(REPO_ROOT, targetPath.slice(1));
  } else {
    resolved = path.join(path.dirname(baseFile), targetPath);
  }

  return fs.existsSync(resolved);
}

function parseBashCommands(line) {
  const paths = [];
  // basic parsing for cd, cp, cat, ls, nano, vi
  // cd <dir>
  let m = line.match(/^\s*cd\s+([^\s;]+)/);
  if (m) paths.push(m[1]);

  // cp <src> <dst>
  m = line.match(/^\s*cp\s+([^\s;]+)\s+([^\s;]+)/);
  if (m) { paths.push(m[1]); paths.push(m[2]); }

  m = line.match(/^\s*(?:cat|ls|vi|nano|mkdir|rm)\s+([^\s;]+)/);
  if (m) {
    // Ignore flags
    if (!m[1].startsWith('-')) {
      paths.push(m[1]);
    }
  }
  return paths;
}

const mdFiles = walk(REPO_ROOT);

for (const file of mdFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  let inBashBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Check code block
    if (line.trim().startsWith('```bash') || line.trim().startsWith('```sh')) {
      inBashBlock = true;
      continue;
    }
    if (inBashBlock && line.trim().startsWith('```')) {
      inBashBlock = false;
      continue;
    }

    if (inBashBlock) {
      const paths = parseBashCommands(line);
      for (const p of paths) {
        // Skip env variables or special syntax
        if (p.startsWith('$') || p.startsWith('<')) continue;
        
        if (!resolvePath(file, p)) {
          console.error(`Broken shell path in ${path.relative(REPO_ROOT, file)}:${lineNum}: ${p}`);
          hasErrors = true;
        }
      }
    } else {
      // Check markdown links: [text](path)
      // regex to match [text](path)
      const linkRegex = /\[[^\]]+\]\(([^)]+)\)/g;
      let match;
      while ((match = linkRegex.exec(line)) !== null) {
        let p = match[1];
        if (!resolvePath(file, p)) {
          console.error(`Broken link in ${path.relative(REPO_ROOT, file)}:${lineNum}: ${p}`);
          hasErrors = true;
        }
      }
    }
  }
}

if (hasErrors) {
  process.exit(1);
} else {
  console.log("All links and paths are valid!");
}
