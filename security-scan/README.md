# Automated Security Scanner

Comprehensive security scanning system for the CI/CD pipeline that detects vulnerabilities in dependencies, code, and commits.

## Features

- **Dependency Scanning**: Checks npm and cargo dependencies for known vulnerabilities
- **Static Code Analysis**: Analyzes TypeScript/JavaScript/Rust code for security issues
- **Secret Detection**: Scans commits for exposed credentials and API keys
- **PR Integration**: Automatically updates pull requests with scan results
- **Advisory Mode**: Reports findings but does not block merges (see below for enabling blocking mode)

## Components

### Scanners

- `npm-audit.ts`: Scans Node.js dependencies using npm audit
- `cargo-audit.ts`: Scans Rust dependencies using cargo audit
- `eslint-scanner.ts`: Analyzes code with ESLint security plugins
- `semgrep-scanner.ts`: Pattern-based security analysis with Semgrep
- `gitleaks-scanner.ts`: Detects secrets in commits with Gitleaks

### Core Modules

- `types.ts`: TypeScript interfaces for vulnerability data
- `aggregator.ts`: Collects and normalizes scanner outputs
- `report-generator.ts`: Generates JSON and Markdown reports
- `orchestrator.ts`: Coordinates all scanners and manages execution

## Configuration Files

- `.gitleaks.toml`: Gitleaks secret detection patterns
- `semgrep.yml`: Semgrep security rules
- `.eslintrc.security.js`: ESLint security configuration

## Usage

### In GitHub Actions

The security scanner runs automatically on all pull requests via `.github/workflows/security-scan.yml`.

### Local Testing

```bash
# Install dependencies
cd security-scan
npm install

# Build the scanner
npm run build

# Run the scan
npm run scan
```

### Test Mode

To validate scanner configuration without blocking PRs:

```bash
TEST_MODE=true npm run scan
```

## Current Behavior

**Important**: The security scanner currently runs in advisory mode only. It reports findings but does not block merges, regardless of severity level. This is due to the GitHub Actions workflow configuration that swallows the orchestrator's exit code (see "Enabling Blocking Mode" below).

The orchestrator itself is correctly implemented to exit with code 1 when critical or high vulnerabilities are detected, but this exit code is not propagated through the current workflow setup.

## Severity Levels

| Severity | CVSS Score | Current Action    | Blocking Action (if enabled) |
| -------- | ---------- | ------------------ | ---------------------------- |
| Critical | 9.0-10.0   | Warn, allow merge  | Block merge                  |
| High     | 7.0-8.9    | Warn, allow merge  | Block merge                  |
| Medium   | 4.0-6.9    | Warn, allow merge  | Warn, allow merge            |
| Low      | 0.1-3.9    | Warn, allow merge  | Warn, allow merge            |
| Info     | 0.0        | Informational only | Informational only           |

## Output

### JSON Report

Machine-readable format saved as `security-scan-results.json`:

```json
{
  "timestamp": "2026-03-27T10:30:00.000Z",
  "scanDuration": 45000,
  "scannedComponents": {
    "frontend": true,
    "backend": true,
    "contracts": true
  },
  "summary": {
    "total": 5,
    "critical": 1,
    "high": 2,
    "medium": 2,
    "low": 0,
    "info": 0
  },
  "vulnerabilities": [...],
  "status": "fail"
}
```

### Markdown Report

Human-readable format saved as `security-scan-report.md` with detailed findings grouped by severity.

### PR Comment

Condensed summary posted as a comment on the pull request with links to detailed reports.

## Validation

To validate the scanner is working correctly:

1. **Test Vulnerable Dependency**: Add `lodash@4.17.15` to package.json
2. **Test Secret Detection**: Commit a file with `const API_KEY = "sk-test123..."`
3. **Test Code Issue**: Commit SQL injection pattern like `db.query("SELECT * FROM users WHERE id = " + userId)`

All three should be detected by the scanner.

## Troubleshooting

### Scanner Timeouts

- Individual scanners timeout after 2 minutes
- Overall scan times out after 5 minutes
- Timeouts don't block merges, only report warnings

### Scanner Failures

- If a scanner fails, other scanners continue
- Partial results are reported
- Scanner failures don't block merges

### False Positives

- Update `.gitleaks.toml` allowlist for secret false positives
- Adjust Semgrep rules in `semgrep.yml`
- Configure ESLint rule severity in `.eslintrc.security.js`

## Enabling Blocking Mode

To make the security scanner actually block merges when critical or high severity vulnerabilities are detected, the GitHub Actions workflow must be modified to respect the orchestrator's exit code.

### Required Changes to `.github/workflows/security-scan-reusable.yml`

The reusable workflow currently has three layers that bypass the exit code. All three must be removed:

1. **Remove job-level `continue-on-error`** (line ~23):
   ```yaml
   jobs:
     security-scan:
   -   continue-on-error: true  # ← REMOVE THIS LINE
   ```

2. **Remove step-level `continue-on-error`** (line ~35):
   ```yaml
       - name: Run security scan
         id: scan
   -     continue-on-error: true  # ← REMOVE THIS LINE
         run: |
           node .platform/security-scan/dist/orchestrator.js || true  # ← ALSO REMOVE || true
   ```

3. **Remove `|| true` from the orchestrator invocation** (line ~37):
   ```yaml
         run: |
   -       node .platform/security-scan/dist/orchestrator.js || true  # ← CHANGE TO:
   +       node .platform/security-scan/dist/orchestrator.js
   ```

4. **Update the final step to use the exit code instead of reading the results file** (lines ~40-43):
   ```yaml
       - name: Note critical/high (non-blocking)
   -     if: steps.scan.outputs.status == 'fail'
   -     run: echo "⚠️ Security scan found critical/high vulnerabilities. Review before merging."
   ```
   
   This step can be removed entirely, as the job will now fail at the orchestrator step when critical/high vulnerabilities are found.

### Which Mechanism to Use for Blocking

Once the above changes are applied, the workflow should key off the **orchestrator's exit code**, not the results file. The orchestrator already implements the correct logic:

- `status === "fail"` → exit 1 (blocks merge)
- `status === "error"` → exit 0 (scanner errors don't block)
- `status === "pass"` → exit 0 (clean scan)

The `security-scan-results.json` file is still written for PR comments and reporting, but the blocking behavior should rely on the exit code, which is the canonical signal.

### Impact on Consuming Repositories

After applying these changes, the following behavior will occur in each consuming repository:

- **shelterflex-web**: PRs with critical/high vulnerabilities will be blocked from merging
- **shelterflex-api**: PRs with critical/high vulnerabilities will be blocked from merging
- **shelterflex-contracts**: PRs with critical/high vulnerabilities will be blocked from merging

Scanner errors (e.g., timeout, tool not installed) will continue to allow merges, as designed.

### Testing the Blocking Behavior

After applying the workflow changes, verify blocking behavior by:

1. Creating a test PR with a known vulnerable dependency (e.g., `lodash@4.17.15`)
2. Confirming the GitHub Actions check fails
3. Removing the vulnerable dependency
4. Confirming the check passes

The test suite in `tests/` verifies the orchestrator's exit code contract independently of the workflow.

## Maintenance

### Updating Scanner Tools

```bash
# Update Gitleaks
wget https://github.com/gitleaks/gitleaks/releases/download/vX.Y.Z/gitleaks_X.Y.Z_linux_x64.tar.gz

# Update Semgrep
pip install --upgrade semgrep

# Update cargo-audit
cargo install cargo-audit --locked --force
```

### Adding Custom Rules

- **Gitleaks**: Add rules to `.gitleaks.toml`
- **Semgrep**: Add rules to `semgrep.yml`
- **ESLint**: Add rules to `.eslintrc.security.js`
