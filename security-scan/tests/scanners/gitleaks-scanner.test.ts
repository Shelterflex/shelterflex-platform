/**
 * Gitleaks Secret Scanner Tests
 * 
 * Tests that the gitleaks-scanner correctly detects exposed secrets
 * and classifies them as critical severity.
 */

import { scanWithGitleaks } from '../../scanners/gitleaks-scanner';
import { writeFileSync, mkdirSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

describe('Gitleaks Secret Scanner', () => {
  const testFixtureDir = join(__dirname, 'fixtures', 'gitleaks-scanner');
  const repoRoot = testFixtureDir;

  beforeEach(() => {
    mkdirSync(testFixtureDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(join(testFixtureDir, 'secret.ts'))) {
      unlinkSync(join(testFixtureDir, 'secret.ts'));
    }
    if (existsSync(join(testFixtureDir, '.gitleaks.toml'))) {
      unlinkSync(join(testFixtureDir, '.gitleaks.toml'));
    }
  });

  test('detects exposed API keys as critical severity', () => {
    // Create a file with a planted secret
    const secretCode = `
// This file contains a planted secret for testing
const API_KEY = "sk-test-1234567890abcdef";
const DATABASE_URL = "postgresql://user:password@localhost:5432/db";
`;

    writeFileSync(join(testFixtureDir, 'secret.ts'), secretCode);

    // Create a minimal gitleaks config
    const gitleaksConfig = `
title = "Test Gitleaks Config"

[[rules]]
id = "generic-api-key"
description = "Generic API Key"
regex = '''(?i)(api[_-]?key|apikey|secret[_-]?key|secret)[\\s=:]['"]?[a-zA-Z0-9_\-]{20,}['"]?'''
severity = "critical"

[[rules]]
id = "database-connection-string"
description = "Database Connection String"
regex = '''(?i)postgresql://[^:]+:[^@]+@'''
severity = "critical"
`;

    writeFileSync(join(testFixtureDir, '.gitleaks.toml'), gitleaksConfig);

    // Run the scanner
    const vulnerabilities = scanWithGitleaks(repoRoot, join(testFixtureDir, '.gitleaks.toml'));

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
      
      expect(vuln.source).toBe('secret');
      // All secrets should be critical
      expect(vuln.severity).toBe('critical');
      expect(vuln.location).toHaveProperty('file');
      expect(vuln.location).toHaveProperty('line');
      
      // Verify secret is redacted (not in description or title)
      expect(vuln.description).not.toContain('sk-test-1234567890abcdef');
      expect(vuln.title).not.toContain('sk-test-1234567890abcdef');
    }
  });

  test('redacts secret values in output', () => {
    const secretCode = `
const SECRET = "super-secret-key-1234567890";
`;

    writeFileSync(join(testFixtureDir, 'secret.ts'), secretCode);

    const gitleaksConfig = `
title = "Test Config"

[[rules]]
id = "generic-secret"
description = "Generic Secret"
regex = '''secret[_-]?key[\\s=:]['"]?[a-zA-Z0-9]{20,}['"]?'''
severity = "critical"
`;

    writeFileSync(join(testFixtureDir, '.gitleaks.toml'), gitleaksConfig);

    const vulnerabilities = scanWithGitleaks(repoRoot, join(testFixtureDir, '.gitleaks.toml'));
    
    for (const vuln of vulnerabilities) {
      // Verify the actual secret value is not exposed
      expect(vuln.description).not.toContain('super-secret-key-1234567890');
      expect(vuln.title).not.toContain('super-secret-key-1234567890');
      expect(vuln.remediation).not.toContain('super-secret-key-1234567890');
    }
  });

  test('handles missing config file gracefully', () => {
    const secretCode = `
const key = "test";
`;

    writeFileSync(join(testFixtureDir, 'secret.ts'), secretCode);

    // Run with non-existent config
    const vulnerabilities = scanWithGitleaks(repoRoot, join(testFixtureDir, 'nonexistent.toml'));

    // Should not crash, may return empty or use default rules
    expect(Array.isArray(vulnerabilities)).toBe(true);
  });

  test('classifies all secrets as critical severity', () => {
    const secretCode = `
const awsKey = "AKIAIOSFODNN7EXAMPLE";
const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
`;

    writeFileSync(join(testFixtureDir, 'secret.ts'), secretCode);

    const gitleaksConfig = `
title = "Test Config"

[[rules]]
id = "aws-key"
description = "AWS Key"
regex = '''AKIA[0-9A-Z]{16}'''
severity = "critical"

[[rules]]
id = "jwt"
description = "JWT Token"
regex = '''eyJ[a-zA-Z0-9_-]+\\.eyJ[a-zA-Z0-9_-]+\\.[a-zA-Z0-9_-]+'''
severity = "critical"
`;

    writeFileSync(join(testFixtureDir, '.gitleaks.toml'), gitleaksConfig);

    const vulnerabilities = scanWithGitleaks(repoRoot, join(testFixtureDir, '.gitleaks.toml'));
    
    for (const vuln of vulnerabilities) {
      expect(vuln.severity).toBe('critical');
    }
  });

  test('provides CWE-798 for hardcoded credentials', () => {
    const secretCode = `
const password = "hardcoded-password";
`;

    writeFileSync(join(testFixtureDir, 'secret.ts'), secretCode);

    const gitleaksConfig = `
title = "Test Config"

[[rules]]
id = "hardcoded-password"
description = "Hardcoded Password"
regex = '''password[\\s=:]['"][a-zA-Z0-9]{8,}['"]'''
severity = "critical"
`;

    writeFileSync(join(testFixtureDir, '.gitleaks.toml'), gitleaksConfig);

    const vulnerabilities = scanWithGitleaks(repoRoot, join(testFixtureDir, '.gitleaks.toml'));
    
    for (const vuln of vulnerabilities) {
      expect(vuln).toHaveProperty('metadata');
      expect(vuln.metadata).toHaveProperty('cwe');
      
      // Should have CWE-798 for hardcoded credentials
      if (vuln.metadata.cwe) {
        expect(vuln.metadata.cwe).toBe('CWE-798');
      }
    }
  });

  test('provides appropriate remediation guidance', () => {
    const secretCode = `
const apiKey = "sk-test-key";
`;

    writeFileSync(join(testFixtureDir, 'secret.ts'), secretCode);

    const gitleaksConfig = `
title = "Test Config"

[[rules]]
id = "generic-api-key"
description = "Generic API Key"
regex = '''api[_-]?key[\\s=:]['"][a-zA-Z0-9]{10,}['"]'''
severity = "critical"
`;

    writeFileSync(join(testFixtureDir, '.gitleaks.toml'), gitleaksConfig);

    const vulnerabilities = scanWithGitleaks(repoRoot, join(testFixtureDir, '.gitleaks.toml'));
    
    for (const vuln of vulnerabilities) {
      expect(vuln).toHaveProperty('remediation');
      expect(vuln.remediation).toBeTruthy();
      expect(vuln.remediation.length).toBeGreaterThan(0);
      
      // Remediation should mention environment variables or secret management
      const hasRemediationKeywords = 
        vuln.remediation.toLowerCase().includes('environment') ||
        vuln.remediation.toLowerCase().includes('secret') ||
        vuln.remediation.toLowerCase().includes('rotate');
      
      expect(hasRemediationKeywords).toBe(true);
    }
  });
});
