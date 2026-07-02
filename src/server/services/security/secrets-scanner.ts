/**
 * Secrets Scanner Service
 * Detects exposed secrets like API keys, tokens, passwords, and credentials
 */

import type { SecurityIssueData, ScanContext } from "./security-scanner";

interface SecretPattern {
  name: string;
  pattern: RegExp;
  severity: "CRITICAL" | "HIGH";
  description: string;
  remediation: string;
}

const SECRET_PATTERNS: SecretPattern[] = [
  {
    name: "AWS Access Key",
    pattern: /(?:AWS|aws|Aws)?_?(?:ACCESS|access|Access)?_?(?:KEY|key|Key)?_?(?:ID|id|Id)?['"]?\s*[:=]\s*['"]?([A-Z0-9]{20})(?:['"]|$)/g,
    severity: "CRITICAL",
    description: "AWS Access Key ID detected. This credential can be used to access AWS resources.",
    remediation: "Remove the hardcoded AWS Access Key. Use AWS IAM roles, environment variables, or AWS Secrets Manager.",
  },
  {
    name: "AWS Secret Access Key",
    pattern: /(?:AWS|aws|Aws)?_?(?:SECRET|secret|Secret)?_?(?:ACCESS|access|Access)?_?(?:KEY|key|Key)?['"]?\s*[:=]\s*['"]?([A-Za-z0-9/+=]{40})(?:['"]|$)/g,
    severity: "CRITICAL",
    description: "AWS Secret Access Key detected. This allows full access to AWS services.",
    remediation: "Remove the hardcoded AWS Secret Key. Use AWS IAM roles, environment variables, or AWS Secrets Manager.",
  },
  {
    name: "GitHub Token",
    pattern: /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}/g,
    severity: "CRITICAL",
    description: "GitHub Personal Access Token detected. This can be used to access GitHub repositories and resources.",
    remediation: "Revoke this GitHub token immediately at https://github.com/settings/tokens. Use GitHub Apps or environment variables.",
  },
  {
    name: "Generic API Key",
    pattern: /(?:api[_-]?key|apikey|api_token)['"]?\s*[:=]\s*['"]?([a-zA-Z0-9_\-]{20,})(?:['"]|$)/gi,
    severity: "HIGH",
    description: "Generic API key pattern detected. This may provide access to external services.",
    remediation: "Remove hardcoded API keys. Use environment variables, secret management systems, or API key vaults.",
  },
  {
    name: "Private Key",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    severity: "CRITICAL",
    description: "Private key detected. This could compromise encryption and authentication.",
    remediation: "Remove private keys from the codebase immediately. Use secret management systems and rotate keys.",
  },
  {
    name: "Stripe API Key",
    pattern: /(?:sk|pk)_(?:live|test)_[0-9a-zA-Z]{24,}/g,
    severity: "CRITICAL",
    description: "Stripe API key detected. This can be used to access payment processing systems.",
    remediation: "Revoke this Stripe key immediately. Use environment variables and Stripe's secure key management.",
  },
  {
    name: "Google API Key",
    pattern: /AIza[0-9A-Za-z\\-_]{35}/g,
    severity: "HIGH",
    description: "Google API key detected. This may provide access to Google Cloud services.",
    remediation: "Restrict API key access in Google Cloud Console and use environment variables.",
  },
  {
    name: "Slack Token",
    pattern: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,}/g,
    severity: "HIGH",
    description: "Slack token detected. This can be used to access Slack workspaces and channels.",
    remediation: "Revoke this Slack token immediately and use environment variables or OAuth.",
  },
  {
    name: "JWT Token",
    pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
    severity: "HIGH",
    description: "JWT token detected. This may contain sensitive information or provide unauthorized access.",
    remediation: "Remove JWT tokens from code. Implement proper token handling and use secure storage.",
  },
  {
    name: "Database Connection String",
    pattern: /(?:mongodb|mysql|postgres|postgresql):\/\/[^\s'"]+/gi,
    severity: "CRITICAL",
    description: "Database connection string detected. This may expose database credentials.",
    remediation: "Remove database connection strings. Use environment variables and connection pooling services.",
  },
  {
    name: "Password in Code",
    pattern: /(?:password|passwd|pwd)['"]?\s*[:=]\s*['"]([^'"]{8,})['"]?/gi,
    severity: "HIGH",
    description: "Hardcoded password detected. This is a security vulnerability.",
    remediation: "Remove hardcoded passwords. Use environment variables, key management systems, or authentication providers.",
  },
  {
    name: "OAuth Token",
    pattern: /(?:oauth|bearer)['"]?\s*[:=]\s*['"]?([a-zA-Z0-9_\-\.]{20,})(?:['"]|$)/gi,
    severity: "HIGH",
    description: "OAuth token detected. This may provide unauthorized access to protected resources.",
    remediation: "Remove OAuth tokens from code. Implement proper OAuth flow and token management.",
  },
  {
    name: "Azure Key",
    pattern: /[0-9a-zA-Z]{88}==/g,
    severity: "CRITICAL",
    description: "Azure access key detected. This can be used to access Azure resources.",
    remediation: "Revoke this Azure key immediately. Use Azure Key Vault, Managed Identities, or environment variables.",
  },
  {
    name: "Twilio API Key",
    pattern: /SK[0-9a-fA-F]{32}/g,
    severity: "HIGH",
    description: "Twilio API key detected. This can be used to access Twilio services.",
    remediation: "Revoke this Twilio key and use environment variables or API key management.",
  },
  {
    name: "SendGrid API Key",
    pattern: /SG\.[a-zA-Z0-9_\-]{22}\.[a-zA-Z0-9_\-]{43}/g,
    severity: "HIGH",
    description: "SendGrid API key detected. This can be used to send emails on your behalf.",
    remediation: "Revoke this SendGrid key immediately and use environment variables.",
  },
];

class SecretsScanner {
  async scan(context: ScanContext): Promise<SecurityIssueData[]> {
    const issues: SecurityIssueData[] = [];

    for (const file of context.changedFiles) {
      // Skip binary files and certain file types
      if (this.shouldSkipFile(file.filename)) {
        continue;
      }

      const patch = file.patch || "";
      const addedLines = this.extractAddedLines(patch);

      // Scan each added line for secrets
      for (const { lineNumber, content } of addedLines) {
        for (const pattern of SECRET_PATTERNS) {
          const matches = content.matchAll(pattern.pattern);
          
          for (const match of matches) {
            // Skip if it looks like a placeholder or example
            if (this.isPlaceholder(match[0])) {
              continue;
            }

            issues.push({
              severity: pattern.severity,
              type: "SECRET_EXPOSURE",
              title: `${pattern.name} Detected`,
              description: pattern.description,
              remediation: pattern.remediation,
              affectedLines: [
                {
                  file: file.filename,
                  startLine: lineNumber,
                  endLine: lineNumber,
                },
              ],
            });
          }
        }
      }
    }

    return issues;
  }

  private shouldSkipFile(filename: string): boolean {
    const skipExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".pdf",
      ".zip",
      ".tar",
      ".gz",
      ".exe",
      ".dll",
      ".so",
      ".dylib",
    ];

    const skipPatterns = [
      /node_modules/,
      /\.min\./,
      /package-lock\.json/,
      /yarn\.lock/,
      /pnpm-lock\.yaml/,
    ];

    return (
      skipExtensions.some((ext) => filename.toLowerCase().endsWith(ext)) ||
      skipPatterns.some((pattern) => pattern.test(filename))
    );
  }

  private extractAddedLines(patch: string): Array<{
    line: number;
    lineNumber: number;
    content: string;
  }> {
    const lines: Array<{ line: number; lineNumber: number; content: string }> = [];
    const patchLines = patch.split("\n");
    let currentLineNumber = 0;

    for (let i = 0; i < patchLines.length; i++) {
      const line = patchLines[i] || "";

      // Parse line number from hunk header
      if (line.startsWith("@@")) {
        const match = line.match(/@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
        if (match) {
          currentLineNumber = parseInt(match[1] || "0", 10);
        }
        continue;
      }

      // Only check added lines
      if (line.startsWith("+") && !line.startsWith("+++")) {
        lines.push({
          line: i,
          lineNumber: currentLineNumber,
          content: line.substring(1),
        });
      }

      // Increment line number for context and added lines
      if (!line.startsWith("-")) {
        currentLineNumber++;
      }
    }

    return lines;
  }

  private isPlaceholder(value: string): boolean {
    const placeholderPatterns = [
      /xxx+/i,
      /test/i,
      /example/i,
      /sample/i,
      /placeholder/i,
      /your[_-]?key/i,
      /fake/i,
      /dummy/i,
      /123456/,
      /000000/,
      /\*{5,}/,
    ];

    return placeholderPatterns.some((pattern) => pattern.test(value));
  }
}

export const secretsScanner = new SecretsScanner();
