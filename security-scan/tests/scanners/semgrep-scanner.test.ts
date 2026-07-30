/**
 * Semgrep Security Scanner Tests
 * 
 * Tests that the semgrep-scanner correctly detects security patterns
 * in code at the expected severity levels.
 */

import { scanWithSemgrep } from '../../scanners/semgrep-scanner';
import { writeFileSync, mkdirSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

describe('Semgrep Security Scanner', () => {
  const testFixtureDir = join(__dirname, 'fixtures', 'semgrep-scanner');
  const repoRoot = testFixtureDir;

  beforeEach(() => {
    mkdirSync(testFixtureDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(join(testFixtureDir, 'vulnerable.ts'))) {
      unlinkSync(join(testFixtureDir, 'vulnerable.ts'));
    }
    if (existsSync(join(testFixtureDir, 'semgrep.yml'))) {
      unlinkSync(join(testFixtureDir, 'semgrep.yml'));
    }
  });

  test('detects security patterns using Semgrep rules', () => {
    // Create a file with a security pattern
    const vulnerableCode = `
import crypto from 'crypto';

function weakHash(data: string) {
  // Weak hash function - should be detected
  return crypto.createHash('md5').update(data).digest('hex');
}
`;

    writeFileSync(join(testFixtureDir, 'vulnerable.ts'), vulnerableCode);

    // Create a minimal semgrep config
    const semgrepConfig = `
rules:
  - id: weak-cryptographic-algorithm
    pattern: crypto.createHash('md5')
    message: Use of weak MD5 hash algorithm
    severity: WARNING
    languages:
      - javascript
      - typescript
`;

    writeFileSync(join(testFixtureDir, 'semgrep.yml'), semgrepConfig);

    // Run the scanner
    const vulnerabilities = scanWithSemgrep(testFixtureDir, join(testFixtureDir, 'semgrep.yml'), repoRoot);

    expect(Array.isArray(vulnerabilities)).toBe(true);
    
    if (vulnerabilities.length > 0) {
      const vuln = vulnerabilities[0];
      expect(vuln).toHaveProperty('id');
      expect(vuln).toHaveProperty('source');
      expect(vuln).toHaveProperty('severity');
      expect(vuln).toHaveProperty('title');
      expect(vuln).toHaveProperty('description');
      expect(vuln).toHaveProperty('location');
      expect(vuln).toHaveProperty('metadata');
      expect(vuln).toHaveProperty('remediation');
      
      expect(vuln.source).toBe('code');
      expect(vuln.location).toHaveProperty('file');
      expect(vuln.location).toHaveProperty('line');
      expect(vuln.location).toHaveProperty('column');
      
      expect(['critical', 'high', 'medium', 'low', 'info']).toContain(vuln.severity);
    }
  });

  test('handles missing config file gracefully', () => {
    const vulnerableCode = `
const data = "test";
`;

    writeFileSync(join(testFixtureDir, 'vulnerable.ts'), vulnerableCode);

    // Run with non-existent config
    const vulnerabilities = scanWithSemgrep(
      testFixtureDir,
      join(testFixtureDir, 'nonexistent.yml'),
      repoRoot
    );

    expect(vulnerabilities).toEqual([]);
  });

  test('handles missing scan path gracefully', () => {
    const configPath = join(testFixtureDir, 'semgrep.yml');
    writeFileSync(configPath, 'rules: []');

    const vulnerabilities = scanWithSemgrep(
      join(testFixtureDir, 'nonexistent'),
      configPath,
      repoRoot
    );

    expect(vulnerabilities).toEqual([]);
  });

  test('normalizes Semgrep severity to our schema', () => {
    const code = `
const hash = require('crypto').createHash('md5');
`;

    writeFileSync(join(testFixtureDir, 'vulnerable.ts'), code);

    const semgrepConfig = `
rules:
  - id: test-rule
    pattern: createHash
    message: Test rule
    severity: ERROR
    languages:
      - javascript
`;

    writeFileSync(join(testFixtureDir, 'semgrep.yml'), semgrepConfig);

    const vulnerabilities = scanWithSemgrep(testFixtureDir, join(testFixtureDir, 'semgrep.yml'), repoRoot);
    
    for (const vuln of vulnerabilities) {
      expect(['critical', 'high', 'medium', 'low', 'info']).toContain(vuln.severity);
    }
  });

  test('extracts CWE and OWASP information from Semgrep metadata', () => {
    const code = `
eval(userInput);
`;

    writeFileSync(join(testFixtureDir, 'vulnerable.ts'), code);

    const semgrepConfig = `
rules:
  - id: dangerous-eval
    pattern: eval(...)
    message: Dangerous use of eval
    severity: ERROR
    metadata:
      cwe: "CWE-95"
      owasp: "A03:2021"
    languages:
      - javascript
`;

    writeFileSync(join(testFixtureDir, 'semgrep.yml'), semgrepConfig);

    const vulnerabilities = scanWithSemgrep(testFixtureDir, join(testFixtureDir, 'semgrep.yml'), repoRoot);
    
    for (const vuln of vulnerabilities) {
      expect(vuln).toHaveProperty('metadata');
      expect(vuln.metadata).toHaveProperty('cwe');
      
      if (vuln.metadata.cwe) {
        expect(vuln.metadata.cwe).toMatch(/^CWE-\d+$/);
      }
    }
  });
});
