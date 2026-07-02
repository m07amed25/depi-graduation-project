/**
 * OWASP Scanner Service
 * Detects OWASP Top 10 security vulnerabilities in code
 */

import type { SecurityIssueData, ScanContext } from "./security-scanner";

interface OwaspPattern {
  id: string;
  name: string;
  pattern: RegExp;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  cweId: string;
  description: string;
  remediation: string;
  filePatterns?: RegExp[];
}

const OWASP_PATTERNS: OwaspPattern[] = [
  {
    id: "A01",
    name: "SQL Injection",
    pattern: /(?:execute|query|exec)\s*\(\s*['"`]?(?:SELECT|INSERT|UPDATE|DELETE|DROP).*\+.*['"`]?\s*\)/gi,
    severity: "CRITICAL",
    cweId: "CWE-89",
    description: "Potential SQL injection vulnerability detected. User input is being concatenated directly into SQL queries.",
    remediation: "Use parameterized queries or prepared statements. Never concatenate user input directly into SQL strings. Use ORM libraries with built-in protection.",
    filePatterns: [/\.(js|ts|py|php|java|cs)$/],
  },
  {
    id: "A02",
    name: "Broken Authentication - Weak Password",
    pattern: /password.*=.*['"`](?:[a-zA-Z0-9]{1,7}|password|123456|admin)['"`]/gi,
    severity: "HIGH",
    cweId: "CWE-798",
    description: "Weak or hardcoded password detected. This compromises authentication security.",
    remediation: "Never hardcode passwords. Use strong password hashing (bcrypt, argon2). Implement password complexity requirements.",
  },
  {
    id: "A03",
    name: "Sensitive Data Exposure - No Encryption",
    pattern: /http:\/\/(?!localhost|127\.0\.0\.1)/gi,
    severity: "MEDIUM",
    cweId: "CWE-319",
    description: "Unencrypted HTTP connection detected. Sensitive data may be transmitted in plain text.",
    remediation: "Use HTTPS for all connections. Implement TLS/SSL encryption. Use environment variables for sensitive URLs.",
    filePatterns: [/\.(js|ts|jsx|tsx|py|java|cs|go)$/],
  },
  {
    id: "A03",
    name: "Sensitive Data Exposure - Logging",
    pattern: /console\.log.*(?:password|token|secret|key|credential)/gi,
    severity: "HIGH",
    cweId: "CWE-532",
    description: "Sensitive information is being logged. This may expose credentials or secrets.",
    remediation: "Remove sensitive data from logs. Implement secure logging practices. Use log sanitization.",
  },
  {
    id: "A04",
    name: "XML External Entities (XXE)",
    pattern: /new\s+(?:XML|Xml)(?:Reader|Document|Parser)\s*\([^)]*\)/g,
    severity: "HIGH",
    cweId: "CWE-611",
    description: "XML parser may be vulnerable to XXE attacks if not properly configured.",
    remediation: "Disable external entity processing in XML parsers. Use safe XML parsing libraries with XXE protection.",
    filePatterns: [/\.(js|ts|java|cs|py)$/],
  },
  {
    id: "A05",
    name: "Broken Access Control - Missing Authorization",
    pattern: /(?:router|app)\.(get|post|put|delete|patch)\s*\(\s*['"`]\/(?:admin|api)\/[^'"`]*['"`]\s*,\s*(?:async\s*)?\([^)]*\)\s*=>\s*{(?![\s\S]*(?:isAuthenticated|requireAuth|checkAuth|verifyToken|isAdmin))/gi,
    severity: "CRITICAL",
    cweId: "CWE-285",
    description: "API endpoint appears to lack authentication/authorization checks.",
    remediation: "Implement authentication middleware. Verify user permissions before granting access. Use role-based access control (RBAC).",
    filePatterns: [/\.(js|ts)$/],
  },
  {
    id: "A06",
    name: "Security Misconfiguration - Debug Mode",
    pattern: /(?:DEBUG|debug)\s*=\s*(?:true|True|TRUE)/gi,
    severity: "MEDIUM",
    cweId: "CWE-489",
    description: "Debug mode enabled in code. This may expose sensitive information in production.",
    remediation: "Disable debug mode in production. Use environment variables for configuration. Implement proper error handling.",
  },
  {
    id: "A07",
    name: "Cross-Site Scripting (XSS)",
    pattern: /innerHTML\s*=|dangerouslySetInnerHTML/gi,
    severity: "HIGH",
    cweId: "CWE-79",
    description: "Potential XSS vulnerability. User input may be rendered without sanitization.",
    remediation: "Sanitize user input before rendering. Use textContent instead of innerHTML. Implement Content Security Policy (CSP).",
    filePatterns: [/\.(js|ts|jsx|tsx)$/],
  },
  {
    id: "A08",
    name: "Insecure Deserialization",
    pattern: /(?:eval|Function)\s*\(/gi,
    severity: "CRITICAL",
    cweId: "CWE-502",
    description: "Use of eval() or Function constructor detected. This can lead to code injection.",
    remediation: "Never use eval() or Function constructor with user input. Use JSON.parse() for data. Implement input validation.",
  },
  {
    id: "A09",
    name: "Using Components with Known Vulnerabilities",
    pattern: /require\s*\(\s*['"`](?:express|lodash|moment|request)['"`]\s*\)/gi,
    severity: "MEDIUM",
    cweId: "CWE-1035",
    description: "Usage of potentially outdated libraries detected. Some libraries may have known vulnerabilities.",
    remediation: "Keep dependencies up to date. Run npm audit regularly. Use tools like Snyk or Dependabot.",
  },
  {
    id: "A10",
    name: "Insufficient Logging - Missing Error Handling",
    pattern: /catch\s*\([^)]*\)\s*{\s*}/g,
    severity: "MEDIUM",
    cweId: "CWE-778",
    description: "Empty catch block detected. Errors are being silently swallowed.",
    remediation: "Implement proper error logging and handling. Use monitoring tools. Never ignore caught exceptions.",
  },
  {
    id: "A01",
    name: "NoSQL Injection",
    pattern: /(?:find|findOne|update|delete)(?:One|Many)?\s*\(\s*\{[^}]*\$where/gi,
    severity: "CRITICAL",
    cweId: "CWE-943",
    description: "Potential NoSQL injection vulnerability. Using $where operator with user input.",
    remediation: "Avoid using $where operator. Validate and sanitize all user inputs. Use parameterized queries.",
    filePatterns: [/\.(js|ts)$/],
  },
  {
    id: "A05",
    name: "Path Traversal",
    pattern: /(?:fs\.readFile|fs\.readFileSync|res\.sendFile)\s*\([^)]*\+[^)]*\)/gi,
    severity: "HIGH",
    cweId: "CWE-22",
    description: "Potential path traversal vulnerability. User input may be used to access arbitrary files.",
    remediation: "Validate and sanitize file paths. Use path.join() and path.resolve(). Implement whitelist of allowed paths.",
    filePatterns: [/\.(js|ts)$/],
  },
  {
    id: "A07",
    name: "Server-Side Request Forgery (SSRF)",
    pattern: /(?:fetch|axios|request|got)\s*\([^)]*req\.(?:body|query|params)/gi,
    severity: "HIGH",
    cweId: "CWE-918",
    description: "Potential SSRF vulnerability. User input may be used to make server-side requests.",
    remediation: "Validate and whitelist URLs. Restrict outbound connections. Use URL parsing libraries with validation.",
    filePatterns: [/\.(js|ts)$/],
  },
  {
    id: "A02",
    name: "Weak Cryptographic Algorithm",
    pattern: /(?:createHash|createCipher)\s*\(\s*['"`](?:md5|sha1|des)['"`]/gi,
    severity: "HIGH",
    cweId: "CWE-327",
    description: "Weak cryptographic algorithm detected. MD5, SHA1, and DES are not secure.",
    remediation: "Use strong algorithms: SHA-256, SHA-512, AES-256. Use bcrypt or argon2 for password hashing.",
  },
  {
    id: "A03",
    name: "Insecure Random Number Generation",
    pattern: /Math\.random\(\)/gi,
    severity: "MEDIUM",
    cweId: "CWE-338",
    description: "Math.random() is not cryptographically secure and should not be used for security purposes.",
    remediation: "Use crypto.randomBytes() or crypto.getRandomValues() for security-sensitive operations.",
    filePatterns: [/\.(js|ts)$/],
  },
];

class OwaspScanner {
  async scan(context: ScanContext): Promise<SecurityIssueData[]> {
    const issues: SecurityIssueData[] = [];

    for (const file of context.changedFiles) {
      // Check if file type is relevant for each pattern
      const addedLines = this.extractAddedLines(file.patch || "");

      for (const { lineNumber, content } of addedLines) {
        for (const pattern of OWASP_PATTERNS) {
          // Check if file pattern matches
          if (
            pattern.filePatterns &&
            !pattern.filePatterns.some((fp) => fp.test(file.filename))
          ) {
            continue;
          }

          // Reset regex lastIndex
          pattern.pattern.lastIndex = 0;

          if (pattern.pattern.test(content)) {
            issues.push({
              severity: pattern.severity,
              type: "OWASP_TOP_10",
              cweId: pattern.cweId,
              title: `OWASP ${pattern.id}: ${pattern.name}`,
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

  private extractAddedLines(patch: string): Array<{
    lineNumber: number;
    content: string;
  }> {
    const lines: Array<{ lineNumber: number; content: string }> = [];
    const patchLines = patch.split("\n");
    let currentLineNumber = 0;

    for (const line of patchLines) {
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
}

export const owaspScanner = new OwaspScanner();
