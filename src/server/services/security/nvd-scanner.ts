/**
 * NVD (National Vulnerability Database) Scanner
 * Direct integration with NIST NVD API for CVE information
 */

import type { SecurityIssueData } from "./security-scanner";

interface NVDCVEItem {
  cve: {
    id: string;
    sourceIdentifier: string;
    published: string;
    lastModified: string;
    vulnStatus: string;
    descriptions: Array<{
      lang: string;
      value: string;
    }>;
    metrics: {
      cvssMetricV31?: Array<{
        cvssData: {
          baseScore: number;
          baseSeverity: string;
          vectorString: string;
        };
      }>;
      cvssMetricV2?: Array<{
        cvssData: {
          baseScore: number;
          vectorString: string;
        };
        baseSeverity: string;
      }>;
    };
    weaknesses?: Array<{
      description: Array<{
        lang: string;
        value: string; // CWE ID
      }>;
    }>;
    references: Array<{
      url: string;
      source: string;
    }>;
  };
}

interface NVDResponse {
  resultsPerPage: number;
  startIndex: number;
  totalResults: number;
  vulnerabilities: NVDCVEItem[];
}

class NVDScanner {
  private readonly NVD_API_BASE = "https://services.nvd.nist.gov/rest/json/cves/2.0";
  private readonly API_KEY = process.env.NVD_API_KEY;
  private readonly RATE_LIMIT_DELAY = 6000; // 6 seconds between requests (10 requests per minute)
  private lastRequestTime = 0;

  /**
   * Search NVD for CVEs related to a specific keyword or product
   */
  async searchCVEs(keyword: string): Promise<SecurityIssueData[]> {
    if (!this.API_KEY) {
      console.warn("NVD_API_KEY not configured. Skipping NVD search.");
      return [];
    }

    await this.rateLimit();

    try {
      const url = new URL(this.NVD_API_BASE);
      url.searchParams.append("keywordSearch", keyword);
      url.searchParams.append("resultsPerPage", "20");

      const response = await fetch(url.toString(), {
        headers: {
          "apiKey": this.API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`NVD API error: ${response.status} ${response.statusText}`);
      }

      const data: NVDResponse = await response.json();
      return this.processCVEs(data.vulnerabilities);
    } catch (error) {
      console.error(`NVD search failed for keyword "${keyword}":`, error);
      return [];
    }
  }

  /**
   * Get detailed information about a specific CVE
   */
  async getCVEDetails(cveId: string): Promise<SecurityIssueData | null> {
    if (!this.API_KEY) {
      console.warn("NVD_API_KEY not configured. Skipping NVD lookup.");
      return null;
    }

    await this.rateLimit();

    try {
      const url = new URL(this.NVD_API_BASE);
      url.searchParams.append("cveId", cveId);

      const response = await fetch(url.toString(), {
        headers: {
          "apiKey": this.API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`NVD API error: ${response.status} ${response.statusText}`);
      }

      const data: NVDResponse = await response.json();
      
      if (data.vulnerabilities.length === 0) {
        return null;
      }

      const issues = this.processCVEs(data.vulnerabilities);
      return issues[0] || null;
    } catch (error) {
      console.error(`Failed to get CVE details for ${cveId}:`, error);
      return null;
    }
  }

  /**
   * Search for CVEs by CPE (Common Platform Enumeration)
   * Example: cpe:2.3:a:nodejs:node.js:*:*:*:*:*:*:*:*
   */
  async searchByCPE(cpeName: string): Promise<SecurityIssueData[]> {
    if (!this.API_KEY) {
      console.warn("NVD_API_KEY not configured. Skipping NVD search.");
      return [];
    }

    await this.rateLimit();

    try {
      const url = new URL(this.NVD_API_BASE);
      url.searchParams.append("cpeName", cpeName);
      url.searchParams.append("resultsPerPage", "50");

      const response = await fetch(url.toString(), {
        headers: {
          "apiKey": this.API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`NVD API error: ${response.status} ${response.statusText}`);
      }

      const data: NVDResponse = await response.json();
      return this.processCVEs(data.vulnerabilities);
    } catch (error) {
      console.error(`NVD CPE search failed for "${cpeName}":`, error);
      return [];
    }
  }

  /**
   * Get recent CVEs (published in the last N days)
   */
  async getRecentCVEs(days: number = 7): Promise<SecurityIssueData[]> {
    if (!this.API_KEY) {
      console.warn("NVD_API_KEY not configured. Skipping NVD search.");
      return [];
    }

    await this.rateLimit();

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const url = new URL(this.NVD_API_BASE);
      url.searchParams.append("pubStartDate", startDate.toISOString());
      url.searchParams.append("pubEndDate", endDate.toISOString());
      url.searchParams.append("resultsPerPage", "100");

      const response = await fetch(url.toString(), {
        headers: {
          "apiKey": this.API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`NVD API error: ${response.status} ${response.statusText}`);
      }

      const data: NVDResponse = await response.json();
      return this.processCVEs(data.vulnerabilities);
    } catch (error) {
      console.error(`Failed to get recent CVEs:`, error);
      return [];
    }
  }

  /**
   * Process CVE items from NVD response
   */
  private processCVEs(cveItems: NVDCVEItem[]): SecurityIssueData[] {
    return cveItems.map((item) => {
      const cve = item.cve;
      const description = cve.descriptions.find((d) => d.lang === "en")?.value || "";
      
      // Extract severity from CVSS
      let severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO" = "MEDIUM";
      let cvssScore = 0;

      if (cve.metrics.cvssMetricV31?.[0]) {
        const metric = cve.metrics.cvssMetricV31[0];
        cvssScore = metric.cvssData.baseScore;
        severity = this.mapCVSSSeverity(metric.cvssData.baseSeverity);
      } else if (cve.metrics.cvssMetricV2?.[0]) {
        const metric = cve.metrics.cvssMetricV2[0];
        cvssScore = metric.cvssData.baseScore;
        severity = this.mapCVSSSeverity(metric.baseSeverity);
      }

      // Extract CWE IDs
      const cweIds =
        cve.weaknesses?.flatMap((w) =>
          w.description.map((d) => d.value).filter((v) => v.startsWith("CWE-"))
        ) || [];

      // Generate remediation advice
      const remediation = this.generateRemediation(cve, severity);

      return {
        severity,
        type: "VULNERABILITY" as const,
        cveId: cve.id,
        cweId: cweIds[0],
        title: `${cve.id}: Vulnerability Detected`,
        description: `${description}\n\nCVSS Score: ${cvssScore}\nPublished: ${new Date(cve.published).toLocaleDateString()}\nStatus: ${cve.vulnStatus}`,
        remediation,
        affectedLines: [], // NVD doesn't provide line-level information
      };
    });
  }

  /**
   * Map CVSS severity to our severity levels
   */
  private mapCVSSSeverity(
    cvss: string
  ): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO" {
    switch (cvss.toUpperCase()) {
      case "CRITICAL":
        return "CRITICAL";
      case "HIGH":
        return "HIGH";
      case "MEDIUM":
        return "MEDIUM";
      case "LOW":
        return "LOW";
      default:
        return "INFO";
    }
  }

  /**
   * Generate remediation advice based on CVE information
   */
  private generateRemediation(cve: NVDCVEItem["cve"], severity: string): string {
    const references = cve.references
      .slice(0, 3)
      .map((ref) => ref.url)
      .join("\n");

    return `**${severity} Severity Vulnerability**

**Recommended Actions:**
1. Review the vulnerability details and assess impact on your application
2. Check if affected components are used in your codebase
3. Update to a patched version if available
4. Implement workarounds or mitigations if no patch is available
5. Monitor vendor advisories for updates

**References:**
${references}

**More Information:**
Visit https://nvd.nist.gov/vuln/detail/${cve.id} for complete details.`;
  }

  /**
   * Rate limiting to comply with NVD API limits
   * - With API key: 50 requests per 30 seconds
   * - Without API key: 5 requests per 30 seconds
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // With API key, we can make requests more frequently
    const minDelay = this.API_KEY ? 600 : this.RATE_LIMIT_DELAY;

    if (timeSinceLastRequest < minDelay) {
      await new Promise((resolve) =>
        setTimeout(resolve, minDelay - timeSinceLastRequest)
      );
    }

    this.lastRequestTime = Date.now();
  }
}

export const nvdScanner = new NVDScanner();
