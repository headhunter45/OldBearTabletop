import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_SRC = path.resolve(__dirname, '..');

function getSourceFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getSourceFiles(fullPath));
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      results.push(fullPath);
    }
  }
  return results;
}

function extractImports(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const importRegex = /(?:import|from)\s+['"]([^'"]+)['"]/g;
  const matches: string[] = [];
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

describe('Architectural Module Boundary Enforcement (OB-136)', () => {
  it('enforces that src/common never imports from src/vtt or src/brawl', () => {
    const commonDir = path.join(CLIENT_SRC, 'common');
    const commonFiles = getSourceFiles(commonDir);

    assert.ok(commonFiles.length > 0, 'Found files in src/common');

    const violations: { file: string; importPath: string }[] = [];

    for (const file of commonFiles) {
      const imports = extractImports(file);
      for (const imp of imports) {
        if (
          imp.includes('/vtt/') ||
          imp.startsWith('../vtt') ||
          imp.startsWith('../../vtt') ||
          imp.includes('/brawl/') ||
          imp.startsWith('../brawl') ||
          imp.startsWith('../../brawl')
        ) {
          violations.push({
            file: path.relative(CLIENT_SRC, file),
            importPath: imp,
          });
        }
      }
    }

    assert.deepStrictEqual(
      violations,
      [],
      `src/common must remain independent of game modes, but found violations:\n` +
        violations.map((v) => `  ${v.file} -> ${v.importPath}`).join('\n')
    );
  });

  it('enforces that src/vtt never imports from src/brawl', () => {
    const vttDir = path.join(CLIENT_SRC, 'vtt');
    const vttFiles = getSourceFiles(vttDir);

    assert.ok(vttFiles.length > 0, 'Found files in src/vtt');

    const violations: { file: string; importPath: string }[] = [];

    for (const file of vttFiles) {
      const imports = extractImports(file);
      for (const imp of imports) {
        if (imp.includes('/brawl/') || imp.startsWith('../brawl') || imp.startsWith('../../brawl')) {
          violations.push({
            file: path.relative(CLIENT_SRC, file),
            importPath: imp,
          });
        }
      }
    }

    assert.deepStrictEqual(
      violations,
      [],
      `src/vtt must never import from src/brawl, but found violations:\n` +
        violations.map((v) => `  ${v.file} -> ${v.importPath}`).join('\n')
    );
  });

  it('enforces that src/brawl never imports from src/vtt', () => {
    const brawlDir = path.join(CLIENT_SRC, 'brawl');
    const brawlFiles = getSourceFiles(brawlDir);

    assert.ok(brawlFiles.length > 0, 'Found files in src/brawl');

    const violations: { file: string; importPath: string }[] = [];

    for (const file of brawlFiles) {
      const imports = extractImports(file);
      for (const imp of imports) {
        if (imp.includes('/vtt/') || imp.startsWith('../vtt') || imp.startsWith('../../vtt')) {
          violations.push({
            file: path.relative(CLIENT_SRC, file),
            importPath: imp,
          });
        }
      }
    }

    assert.deepStrictEqual(
      violations,
      [],
      `src/brawl must never import from src/vtt, but found violations:\n` +
        violations.map((v) => `  ${v.file} -> ${v.importPath}`).join('\n')
    );
  });
});
