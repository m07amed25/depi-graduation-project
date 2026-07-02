/**
 * Security Issue Card Component
 * Displays individual security issues with severity indicators
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  Shield,
  XCircle,
  Info,
  Bug,
  Key,
  Lock,
  Code,
} from "lucide-react";
import { useState } from "react";
import type { SecuritySeverity, SecurityIssueType } from "@/server/db/client";

interface SecurityIssueCardProps {
  issue: {
    id: string;
    severity: SecuritySeverity;
    type: SecurityIssueType;
    cveId?: string | null;
    cweId?: string | null;
    packageName?: string | null;
    packageVersion?: string | null;
    title: string;
    description: string;
    remediation: string;
    affectedLines: unknown;
    falsePositive: boolean;
    resolved: boolean;
    createdAt: Date;
  };
  onMarkFalsePositive?: (issueId: string) => void;
  onResolve?: (issueId: string) => void;
  onReopen?: (issueId: string) => void;
}

const severityColors = {
  CRITICAL: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-blue-500",
  INFO: "bg-slate-500",
};

const severityIcons = {
  CRITICAL: XCircle,
  HIGH: AlertTriangle,
  MEDIUM: AlertTriangle,
  LOW: Info,
  INFO: Info,
};

const typeIcons = {
  VULNERABILITY: Bug,
  SECRET_EXPOSURE: Key,
  OWASP_TOP_10: Shield,
  CODE_QUALITY: Code,
  CWE: Lock,
};

export function SecurityIssueCard({
  issue,
  onMarkFalsePositive,
  onResolve,
  onReopen,
}: SecurityIssueCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const SeverityIcon = severityIcons[issue.severity];
  const TypeIcon = typeIcons[issue.type];

  return (
    <Card className={issue.resolved ? "opacity-60" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`mt-1 rounded-full p-2 ${severityColors[issue.severity]}`}
            >
              <SeverityIcon className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                {issue.title}
                {issue.resolved && (
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Resolved
                  </Badge>
                )}
                {issue.falsePositive && (
                  <Badge variant="outline" className="text-muted-foreground">
                    False Positive
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1 flex items-center gap-2">
                <TypeIcon className="h-3 w-3" />
                {issue.type.replace(/_/g, " ")}
                {issue.cveId && (
                  <>
                    <span className="text-muted-foreground/60">•</span>
                    <a
                      href={`https://nvd.nist.gov/vuln/detail/${issue.cveId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {issue.cveId}
                    </a>
                  </>
                )}
                {issue.cweId && (
                  <>
                    <span className="text-muted-foreground/60">•</span>
                    <span className="text-muted-foreground">{issue.cweId}</span>
                  </>
                )}
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className={severityColors[issue.severity]}>
            {issue.severity}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{issue.description}</p>
            </div>

            {issue.packageName && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm font-medium">Affected Package:</p>
                <p className="text-sm text-muted-foreground">
                  {issue.packageName}
                  {issue.packageVersion && ` (${issue.packageVersion})`}
                </p>
              </div>
            )}

            {Array.isArray(issue.affectedLines) && issue.affectedLines.length > 0 && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm font-medium">Affected Files:</p>
                <ul className="mt-1 space-y-1">
                  {(issue.affectedLines as { file: string; startLine: number; endLine: number }[]).map((location, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">
                      {location.file}
                      {location.startLine > 0 && (
                        <span className="text-muted-foreground/70">
                          {" "}
                          (Line {location.startLine}
                          {location.endLine !== location.startLine &&
                            `-${location.endLine}`}
                          )
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full">
                {isOpen ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    Hide Remediation
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Show Remediation
                  </>
                )}
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 p-4">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  Remediation Steps:
                </p>
                <div className="mt-2 whitespace-pre-wrap text-sm text-blue-800 dark:text-blue-300">
                  {issue.remediation}
                </div>
              </div>
            </CollapsibleContent>

            {!issue.resolved && (
              <div className="flex gap-2">
                {onResolve && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onResolve(issue.id)}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Resolved
                  </Button>
                )}
                {onMarkFalsePositive && !issue.falsePositive && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onMarkFalsePositive(issue.id)}
                  >
                    Mark as False Positive
                  </Button>
                )}
              </div>
            )}

            {issue.resolved && onReopen && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReopen(issue.id)}
              >
                Reopen Issue
              </Button>
            )}
          </div>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
