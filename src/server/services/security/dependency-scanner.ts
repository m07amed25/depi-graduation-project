/**
 * Dependency Vulnerability Scanner
 * Checks dependencies against npm audit, NVD, and other sources
 */

import { exec } from "child_process";
import { promisify } from "util";
import type { SecurityIssueData, ScanContext } from "./security-scanner";

const execAsync = promisify(exec);

interface NpmAuditVulnerability {
  severity: "critical" | "high" | "moderate" | "low" | "info";
  via: Array<{
    title: string;
    url: string;
    severity: string;
    cwe?: string[];
    cvss?: {
      score: number;
      vectorString: string;
    };
  }>;
  effects: string[];
  range: string;
  nodes: string[];
  fixAvailable: boolean | { name: string; version: string };
}

interface NpmAuditResponse {
  auditReportVersion: number;
  vulnerabilities: Record<string, NpmAuditVulnerability>;
  metadata: {
    vulnerabilities: {
      info: number;
      low: number;
      moderate: number;
      high: number;
      critical: number;
      total: number;
    };
  };
}

interface SnykVulnerability {
  severity: string;
  identifiers?: { CVE?: string[]; CWE?: string[] };
  packageName: string;
  version: string;
  title: string;
  description: string;
  fixedIn?: string[];
}

interface SnykResponse {
  vulnerabilities?: SnykVulnerability[];
}

interface NVDQueryResponse {
  resultsPerPage: number;
  startIndex: number;
  totalResults: number;
  vulnerabilities: unknown[];
}

class DependencyScanner {
  async scan(context: ScanContext): Promise<SecurityIssueData[]> {
    const issues: SecurityIssueData[] = [];

    // Check if package.json was modified
    const hasPackageJsonChange = context.changedFiles.some(
      (file) =>
        file.filename === "package.json" ||
        file.filename === "package-lock.json" ||
        file.filename === "yarn.lock" ||
        file.filename === "pnpm-lock.yaml"
    );

    if (!hasPackageJsonChange) {
      return issues;
    }

    try {
      // Run npm audit (works in most Node.js projects)
      const npmIssues = await this.runNpmAudit();
      issues.push(...npmIssues);
    } catch (error) {
      console.error("npm audit failed:", error);
    }

    return issues;
  }

  private async runNpmAudit(): Promise<SecurityIssueData[]> {
    const issues: SecurityIssueData[] = [];

    try {
      // Run npm audit with JSON output
      const { stdout } = await execAsync("npm audit --json", {
        timeout: 30000,
      });

      const auditResult: NpmAuditResponse = JSON.parse(stdout);

      // Process vulnerabilities
      for (const [packageName, vulnerability] of Object.entries(
        auditResult.vulnerabilities
      )) {
        for (const via of vulnerability.via) {
          if (typeof via === "string") continue;

          // Map npm severity to our severity levels
          const severity = this.mapSeverity(via.severity);

          // Extract CVE ID if available
          const cveMatch = via.url?.match(/CVE-\d{4}-\d+/);
          const cveId = cveMatch ? cveMatch[0] : undefined;

          // Extract CWE ID if available
          const cweId = via.cwe?.[0] ? `CWE-${via.cwe[0]}` : undefined;

          issues.push({
            severity,
            type: "VULNERABILITY",
            cveId,
            cweId,
            packageName,
            packageVersion: vulnerability.range,
            title: via.title || `Vulnerability in ${packageName}`,
            description: `Package ${packageName} (${vulnerability.range}) has a known vulnerability. ${via.title || ""}`,
            remediation: this.getRemediation(
              packageName,
              vulnerability.fixAvailable
            ),
            affectedLines: [
              {
                file: "package.json",
                startLine: 1,
                endLine: 1,
              },
            ],
          });
        }
      }
    } catch (error: unknown) {
      // npm audit exits with non-zero code when vulnerabilities are found
      const execError = error as { stdout?: string };
      if (execError.stdout) {
        try {
          const auditResult: NpmAuditResponse = JSON.parse(execError.stdout);
          // Process the result even though npm audit returned an error code
          return this.processAuditResult(auditResult);
        } catch (parseError) {
          console.error("Failed to parse npm audit output:", parseError);
        }
      }
    }

    return issues;
  }

  private processAuditResult(
    auditResult: NpmAuditResponse
  ): SecurityIssueData[] {
    const issues: SecurityIssueData[] = [];

    for (const [packageName, vulnerability] of Object.entries(
      auditResult.vulnerabilities
    )) {
      for (const via of vulnerability.via) {
        if (typeof via === "string") continue;

        const severity = this.mapSeverity(via.severity);
        const cveMatch = via.url?.match(/CVE-\d{4}-\d+/);
        const cveId = cveMatch ? cveMatch[0] : undefined;
        const cweId = via.cwe?.[0] ? `CWE-${via.cwe[0]}` : undefined;

        issues.push({
          severity,
          type: "VULNERABILITY",
          cveId,
          cweId,
          packageName,
          packageVersion: vulnerability.range,
          title: via.title || `Vulnerability in ${packageName}`,
          description: `Package ${packageName} (${vulnerability.range}) has a known vulnerability. ${via.title || ""}`,
          remediation: this.getRemediation(
            packageName,
            vulnerability.fixAvailable
          ),
          affectedLines: [
            {
              file: "package.json",
              startLine: 1,
              endLine: 1,
            },
          ],
        });
      }
    }

    return issues;
  }

  private mapSeverity(
    npmSeverity: string
  ): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO" {
    switch (npmSeverity.toLowerCase()) {
      case "critical":
        return "CRITICAL";
      case "high":
        return "HIGH";
      case "moderate":
        return "MEDIUM";
      case "low":
        return "LOW";
      case "info":
      default:
        return "INFO";
    }
  }

  private getRemediation(
    packageName: string,
    fixAvailable: boolean | { name: string; version: string }
  ): string {
    if (typeof fixAvailable === "object") {
      return `Update ${fixAvailable.name} to version ${fixAvailable.version} or later. Run: npm update ${fixAvailable.name}`;
    } else if (fixAvailable) {
      return `Update ${packageName} to the latest version. Run: npm update ${packageName}`;
    } else {
      return `No automated fix is available. Consider finding an alternative package or waiting for a security patch. Monitor ${packageName} repository for updates.`;
    }
  }

  /**
   * Query NVD (National Vulnerability Database) for CVE information
   * This requires NVD API key: https://nvd.nist.gov/developers/request-an-api-key
   */
  async queryCVE(cveId: string): Promise<NVDQueryResponse | null> {
    const NVD_API_KEY = process.env.NVD_API_KEY;
    
    if (!NVD_API_KEY) {
      console.warn("NVD_API_KEY not set. Skipping NVD query.");
      return null;
    }

    try {
      const response = await fetch(
        `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${cveId}`,
        {
          headers: {
            "apiKey": NVD_API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`NVD API error: ${response.statusText}`);
      }

      const data: NVDQueryResponse = await response.json();
      return data;
    } catch (error) {
      console.error(`Failed to query NVD for ${cveId}:`, error);
      return null;
    }
  }

  /**
   * Check if a package has known vulnerabilities in Snyk database
   * Requires Snyk API token: https://snyk.io/api
   */
  async checkSnyk(
    packageName: string,
    version: string
  ): Promise<SecurityIssueData[]> {
    const SNYK_TOKEN = process.env.SNYK_TOKEN;
    
    if (!SNYK_TOKEN) {
      console.warn("SNYK_TOKEN not set. Skipping Snyk check.");
      return [];
    }

    try {
      const response = await fetch(
        "https://snyk.io/api/v1/test/npm",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `token ${SNYK_TOKEN}`,
          },
          body: JSON.stringify({
            encoding: "plain",
            files: {
              target: {
                contents: JSON.stringify({
                  name: "project",
                  dependencies: {
                    [packageName]: version,
                  },
                }),
              },
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Snyk API error: ${response.statusText}`);
      }

      const data: SnykResponse = await response.json();
      
      // Process Snyk results
      const issues: SecurityIssueData[] = [];
      
      if (data.vulnerabilities) {
        for (const vuln of data.vulnerabilities) {
          issues.push({
            severity: this.mapSeverity(vuln.severity),
            type: "VULNERABILITY",
            cveId: vuln.identifiers?.CVE?.[0],
            cweId: vuln.identifiers?.CWE?.[0],
            packageName: vuln.packageName,
            packageVersion: vuln.version,
            title: vuln.title,
            description: vuln.description,
            remediation: vuln.fixedIn
              ? `Update to version ${vuln.fixedIn.join(" or ")}`
              : "No fix available yet",
            affectedLines: [
              {
                file: "package.json",
                startLine: 1,
                endLine: 1,
              },
            ],
          });
        }
      }

      return issues;
    } catch (error) {
      console.error(`Failed to check Snyk for ${packageName}:`, error);
      return [];
    }
  }
}

export const dependencyScanner = new DependencyScanner();
