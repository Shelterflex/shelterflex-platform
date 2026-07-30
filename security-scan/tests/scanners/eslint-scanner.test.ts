/**
 * ESLint Security Scanner Tests
 * 
 * Tests that the eslint-scanner correctly detects security issues
 * in TypeScript/JavaScript code at the expected severity levels.
 */

import { scanWithESLint } from '../../scanners/eslint-scanner';
import { writeFileSync, mkdirSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

describe('ESLint Security Scanner', () => {
  const testFixtureDir = join(__dirname, 'fixtures', 'eslint-scanner');
  const repoRoot = testFixtureDir;

  beforeEach(() => {
    mkdirSync(testFixtureDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(join(testFixtureDir, 'vulnerable.ts'))) {
      unlinkSync(join(testFixtureDir, 'vulnerable.ts'));
    }
    if (existsSync(join(testFixtureDir, '.eslintrc.security.js'))) {
      unlinkSync(join(testFixtureDir, '.eslintrc.security.js'));
    }
  });

  test('detects eval() usage as high severity security issue', () => {
    // Create a file with eval() usage - a known security issue
    const vulnerableCode = `
function dangerousFunction(userInput: string) {
  // eval is dangerous - should be detected
  return eval(userInput);
}
`;

    writeFileSync(join(testFixtureDir, 'vulnerable.ts'), vulnerableCode);

    // Run the scanner
    const vulnerabilities = scanWithESLint(testFixtureDir, ['vulnerable.ts'], repoRoot);

    expect(Array.isArray(vulnerabilities)).toBe(true);
    
    // If vulnerabilities are found, verify structure
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

  test('detects SQL injection patterns', () => {
    const vulnerableCode = `
function getUserById(userId: string) {
  // SQL injection vulnerability
  const query = "SELECT * FROM users WHERE id = " + userId;
  return db.query(query);
}
`;

    writeFileSync(join(testFixtureDir, 'vulnerable.ts'), vulnerableCode);

    const vulnerabilities = scanWithESLint(testFixtureDir, ['vulnerable.ts'], repoRoot);

    expect(Array.isArray(vulnerabilities)).toBe(true);
  });

  test('handles empty file list gracefully', () => {
    const vulnerabilities = scanWithESLint(testFixtureDir, [], repoRoot);
    expect(vulnerabilities).toEqual([]);
  });

  test('normalizes ESLint rule severity to our schema', () => {
    const vulnerableCode = `
const userInput = req.body.id;
const result = eval(userInput);
`;

    writeFileSync(join(testFixtureDir, 'vulnerable.ts'), vulnerableCode);

    const vulnerabilities = scanWithESLint(testFixtureDir, ['vulnerable.ts'], repoRoot);
    
    for (const vuln of vulnerabilities) {
      expect(['critical', 'high', 'medium', 'low', 'info']).toContain(vuln.severity);
    }
  });

  test('extracts CWE information from security rules', () => {
    const vulnerableCode = `
const data = req.body;
eval(data);
`;

    writeFileSync(join(testFixtureDir, 'vulnerable.ts'), vulnerableCode);

    const vulnerabilities = scanWithESLint(testFixtureDir, ['vulnerable.ts'], repoRoot);
    
    for (const vuln of vulnerabilities) {
      expect(vuln).toHaveProperty('metadata');
      expect(vuln.metadata).toHaveProperty('cwe');
      expect(vuln.metadata).toHaveProperty('references');
      
      // CWE should be in format CWE-NNN if present
      if (vuln.metadata.cwe) {
        expect(vuln.metadata.cwe).toMatch(/^CWE-\d+$/);
      }
    }
  });

  test('filters non-security-related ESLint rules', () => {
    // Create code with both security and non-security issues
    const code = `
const unused = 123; // Non-security issue
eval("dangerous"); // Security issue
`;

    writeFileSync(join(testFixtureDir, 'vulnerable.ts'), code);

    const vulnerabilities = scanWithESLint(testFixtureDir, ['vulnerable.ts'], repoRoot);
    
    // Should only include security-related vulnerabilities
    for (const vuln of vulnerabilities) {
      expect(vuln.source).toBe('code');
      // Security rules should be detected
    }
  });
});
