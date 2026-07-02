import { minimatch } from "minimatch";
import type {
  DiagramType,
  DiagramNode,
  DiagramEdge,
  DiagramTriggerRule,
} from "@/features/diagram/types";
import { generateERD } from "./erd";

export const DIAGRAM_TRIGGER_RULES: DiagramTriggerRule[] = [
  {
    type: "ERD",
    patterns: [
      "prisma/schema.prisma",
      "**/*.prisma",
      "**/schema.sql",
      "**/migrations/**/*.sql",
      "**/*.ddl.sql",
      "**/*.entity.ts",
      "**/*.entity.js",
      "**/entities/**/*.ts",
      "**/models/**/*.js",
      "**/models/**/*.ts",
      "**/*.model.js",
      "**/*.model.ts",
      "**/drizzle/schema.ts",
      "**/drizzle/schema/**/*.ts",
      "**/schema/drizzle.ts",
      "**/schemas/**/*.ts",
      "**/schemas/**/*.js",
      "**/*.schema.ts",
      "**/*.schema.js",
      "**/migrations/**/*.js",
      "**/migrations/**/*.ts",
      "knexfile.js",
      "knexfile.ts",
    ],
  },
];

export function matchTriggerRules(changedFiles: string[]): DiagramType[] {
  const matched = new Set<DiagramType>();

  for (const rule of DIAGRAM_TRIGGER_RULES) {
    for (const file of changedFiles) {
      if (rule.patterns.some((pattern) => minimatch(file, pattern))) {
        matched.add(rule.type);
        break;
      }
    }
  }

  return Array.from(matched);
}

/**
 * Generates a Mermaid diagram definition from the given file contents.
 * Throws on unrecoverable parse failure so the Inngest `onFailure` handler
 * captures a structured error message.
 */
export async function generateMermaidDefinition(
  type: DiagramType,
  fileContents: Record<string, string>,
): Promise<{
  definition: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  warning?: string;
}> {
  // Sort keys for deterministic iteration order regardless of fetch timing
  const sorted: Record<string, string> = {};
  for (const key of Object.keys(fileContents).sort()) {
    sorted[key] = fileContents[key]!;
  }

  if (type === "ERD") {
    return generateERD(sorted);
  }

  throw new Error(`Unsupported diagram type: ${type}`);
}
