import type { DiagramNode, DiagramEdge, DiagramNodeDetailTable } from "@/features/diagram/types";
import type { ERDResult } from "./types";
import { parsePrismaSchema, parseSQLDDL, parseTypeORM, parseSequelize } from "./parsers";
import { parseDrizzleORM, parseMongoose, parseKnex } from "./parsers-orm";

export function generateERD(fileContents: Record<string, string>): {
  definition: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  warning?: string;
} {
  const nodes: DiagramNode[] = [];
  const schemaContent = Object.values(fileContents).join("\n");
  const filePaths = Object.keys(fileContents);

  let result: ERDResult | null = null;

  if (/model\s+\w+\s*\{/.test(schemaContent) || filePaths.some((p) => p.endsWith(".prisma"))) {
    result = parsePrismaSchema(schemaContent);
  } else if (/CREATE\s+TABLE/i.test(schemaContent) || filePaths.some((p) => p.endsWith(".sql"))) {
    result = parseSQLDDL(schemaContent);
  } else if (/@Entity\s*\(/.test(schemaContent) || /@Column\s*\(/.test(schemaContent)) {
    result = parseTypeORM(schemaContent);
  } else if (/(?:pg|mysql|sqlite)Table\s*\(/.test(schemaContent)) {
    result = parseDrizzleORM(schemaContent);
  } else if (/sequelize\.define|Model\.init/.test(schemaContent)) {
    result = parseSequelize(schemaContent);
  } else if (/new\s+(?:mongoose\.)?Schema\s*\(/.test(schemaContent) || /mongoose\.model/.test(schemaContent)) {
    result = parseMongoose(schemaContent);
  } else if (/createTable\s*\(/.test(schemaContent) || /knex\.schema/.test(schemaContent)) {
    result = parseKnex(schemaContent);
  }

  if (!result || result.models.size === 0) {
    return {
      definition: "",
      nodes: [],
      edges: [],
      warning:
        "No database schema detected. Supported formats: Prisma, SQL DDL, TypeORM, Sequelize, Drizzle ORM, Mongoose, Knex.js",
    };
  }

  for (const [modelName, columns] of result.models) {
    const relations = result.modelRelations.get(modelName);
    const detail: DiagramNodeDetailTable = {
      columns,
      ...(relations && relations.length > 0 ? { relations } : {}),
    };
    nodes.push({ id: `table_${modelName}`, label: modelName, type: "TABLE", detail });
  }

  const lines: string[] = ["erDiagram"];

  for (const [modelName, columns] of result.models) {
    lines.push(`  ${modelName} {`);
    for (const col of columns) {
      const pkMarker = col.isPrimaryKey ? " PK" : col.isForeignKey ? " FK" : "";
      lines.push(`    ${col.type} ${col.name}${pkMarker}`);
    }
    lines.push("  }");
  }

  for (const edge of result.edges) {
    const fromModel = edge.fromId.replace("table_", "");
    const toModel = edge.toId.replace("table_", "");
    const rel =
      edge.direction === "ONE_TO_MANY"
        ? "||--o{"
        : edge.direction === "MANY_TO_MANY"
          ? "}o--o{"
          : "||--||";
    lines.push(`  ${fromModel} ${rel} ${toModel} : "${edge.label}"`);
  }

  return { definition: lines.join("\n"), nodes, edges: result.edges };
}
