/**
 * Security Scanner Service
 * Main orchestrator for comprehensive security scanning
 */

import { db } from "../../db";
import type { SecuritySeverity, SecurityIssueType } from "../../db/client";
import { secretsScanner } from "./secrets-scanner";
import { owaspScanner } from "./owasp-scanner";
import { dependencyScanner } from "./dependency-scanner";

export interface SecurityScanResult {
  issueCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  issues: SecurityIssueData[];
}

export interface SecurityIssueData {
  severity: SecuritySeverity;
  type: SecurityIssueType;
  cveId?: string;
  cweId?: string;
  packageName?: string;
  packageVersion?: string;
  title: string;
  description: string;
  remediation: string;
  affectedLines: {
    file: string;
    startLine: number;
    endLine: number;
  }[];
}

export interface ScanContext {
  reviewId: string;
  repositoryFullName: string;
  prNumber: number;
  changedFiles: {
    filename: string;
    patch?: string;
    additions: number;
    deletions: number;
    status: string;
  }[];
  dependencies?: {
    package_json?: Record<string, unknown>;
    package_lock?: Record<string, unknown>;
    yarn_lock?: string;
    pnpm_lock?: Record<string, unknown>;
  };
}

class SecurityScannerService {
  /**
   * Perform comprehensive security scan on a PR
   */
  async scanPullRequest(context: ScanContext): Promise<SecurityScanResult> {
    const issues: SecurityIssueData[] = [];

    try {
      // Run all scanners in parallel
      const [secretIssues, owaspIssues, depIssues] = await Promise.all([
        secretsScanner.scan(context),
        owaspScanner.scan(context),
        dependencyScanner.scan(context),
      ]);

      issues.push(...secretIssues, ...owaspIssues, ...depIssues);

      // Save issues to database
      await this.saveSecurityIssues(context.reviewId, issues);

      // Calculate counts
      const criticalCount = issues.filter((i) => i.severity === "CRITICAL").length;
      const highCount = issues.filter((i) => i.severity === "HIGH").length;
      const mediumCount = issues.filter((i) => i.severity === "MEDIUM").length;
      const lowCount = issues.filter((i) => i.severity === "LOW").length;

      return {
        issueCount: issues.length,
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        issues,
      };
    } catch (error) {
      console.error("Security scan failed:", error);
      throw error;
    }
  }

  /**
   * Save security issues to the database
   */
  private async saveSecurityIssues(
    reviewId: string,
    issues: SecurityIssueData[]
  ): Promise<void> {
    if (issues.length === 0) return;

    await db.securityIssue.createMany({
      data: issues.map((issue) => ({
        reviewId,
        severity: issue.severity,
        type: issue.type,
        cveId: issue.cveId,
        cweId: issue.cweId,
        packageName: issue.packageName,
        packageVersion: issue.packageVersion,
        title: issue.title,
        description: issue.description,
        remediation: issue.remediation,
        affectedLines: issue.affectedLines,
      })),
    });
  }

  /**
   * Get security issues for a review
   */
  async getSecurityIssues(reviewId: string) {
    return db.securityIssue.findMany({
      where: { reviewId },
      orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
    });
  }

  /**
   * Mark security issue as false positive
   */
  async markFalsePositive(issueId: string, userId: string): Promise<void> {
    await db.securityIssue.update({
      where: { id: issueId },
      data: {
        falsePositive: true,
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: userId,
      },
    });
  }

  /**
   * Resolve security issue
   */
  async resolveIssue(issueId: string, userId: string): Promise<void> {
    await db.securityIssue.update({
      where: { id: issueId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: userId,
      },
    });
  }

  /**
   * Get security statistics for a repository
   */
  async getRepositorySecurityStats(repositoryId: string) {
    const reviews = await db.review.findMany({
      where: { repositoryId },
      include: {
        securityIssues: {
          where: { resolved: false },
        },
      },
    });

    const allIssues = reviews.flatMap((r) => r.securityIssues);

    return {
      totalIssues: allIssues.length,
      criticalCount: allIssues.filter((i) => i.severity === "CRITICAL").length,
      highCount: allIssues.filter((i) => i.severity === "HIGH").length,
      mediumCount: allIssues.filter((i) => i.severity === "MEDIUM").length,
      lowCount: allIssues.filter((i) => i.severity === "LOW").length,
      vulnerabilitiesCount: allIssues.filter((i) => i.type === "VULNERABILITY").length,
      secretsCount: allIssues.filter((i) => i.type === "SECRET_EXPOSURE").length,
      owaspCount: allIssues.filter((i) => i.type === "OWASP_TOP_10").length,
    };
  }
}

export const securityScanner = new SecurityScannerService();
