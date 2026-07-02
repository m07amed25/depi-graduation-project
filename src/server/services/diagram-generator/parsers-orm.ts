import type { DiagramEdge } from "@/features/diagram/types";
import type { ERDResult, TableColumn, RelationField } from "./types";


export function parseDrizzleORM(content: string): ERDResult {
  const models = new Map<string, TableColumn[]>();
  const modelRelations = new Map<string, RelationField[]>();
  const edges: DiagramEdge[] = [];

  const tableRegex =
    /export\s+const\s+(\w+)\s*=\s*(?:pg|mysql|sqlite)Table\s*\(\s*['"`](\w+)['"`]\s*,\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;
  let tableMatch: RegExpExecArray | null;

  while ((tableMatch = tableRegex.exec(content)) !== null) {
    const tableName = tableMatch[2]!;
    const tableBody = tableMatch[3]!;
    const columns: TableColumn[] = [];

    const colRegex = /(\w+):\s*(?:\w+\.)?(\w+)\([^)]*\)(?:\.(primaryKey|notNull|unique|references)\([^)]*\))*/g;
    let colMatch: RegExpExecArray | null;

    while ((colMatch = colRegex.exec(tableBody)) !== null) {
      const colName = colMatch[1]!;
      const colType = colMatch[2]!;
      const modifiers = colMatch[0];
      const isPrimaryKey = /\.primaryKey\(/.test(modifiers);
      const hasReferences = /\.references\(/.test(modifiers);
      const isForeignKey = hasReferences || (colName.toLowerCase().endsWith("id") && !isPrimaryKey);
      columns.push({ name: colName, type: colType, isPrimaryKey, isForeignKey });

      const refMatch = /\.references\(\s*\(\)\s*=>\s*(\w+)\.(\w+)/.exec(modifiers);
      if (refMatch) {
        edges.push({
          fromId: `table_${tableName}`,
          toId: `table_${refMatch[1]!}`,
          label: "references",
          direction: "ONE_TO_MANY",
        });
      }
    }

    models.set(tableName, columns);
  }

  const relationRegex =
    /export\s+const\s+\w+Relations\s*=\s*relations\s*\(\s*(\w+)\s*,\s*\(\{\s*(\w+)\s*\}\)\s*=>\s*\(\{([^}]+)\}\)/g;
  let relationMatch: RegExpExecArray | null;

  while ((relationMatch = relationRegex.exec(content)) !== null) {
    const fromTable = relationMatch[1]!;
    const relationsBody = relationMatch[3]!;
    const relRegex = /(\w+):\s*(one|many)\s*\(\s*(\w+)/g;
    let relMatch: RegExpExecArray | null;

    while ((relMatch = relRegex.exec(relationsBody)) !== null) {
      const relType = relMatch[2]!;
      const toTable = relMatch[3]!;
      edges.push({
        fromId: `table_${fromTable}`,
        toId: `table_${toTable}`,
        label: relType === "one" ? "has one" : "has many",
        direction: relType === "one" ? "ONE_TO_ONE" : "ONE_TO_MANY",
      });
    }
  }

  return { models, modelRelations, edges };
}

// ─── Mongoose Parser ──────────────────────────────────────────────────────────

export function parseMongoose(content: string): ERDResult {
  const models = new Map<string, TableColumn[]>();
  const modelRelations = new Map<string, RelationField[]>();
  const edges: DiagramEdge[] = [];

  const schemaRegex =
    /(?:const|let|var)\s+(\w+)Schema\s*=\s*new\s+(?:mongoose\.)?Schema\s*\(\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;
  let schemaMatch: RegExpExecArray | null;

  while ((schemaMatch = schemaRegex.exec(content)) !== null) {
    const schemaVar = schemaMatch[1]!;
    const schemaBody = schemaMatch[2]!;
    const columns: TableColumn[] = [];

    const fieldRegex =
      /(\w+):\s*\{[^}]*type:\s*(?:mongoose\.Schema\.Types\.)?(\w+)(?:[^}]*ref:\s*['"`](\w+)['"`])?/g;
    let fieldMatch: RegExpExecArray | null;

    while ((fieldMatch = fieldRegex.exec(schemaBody)) !== null) {
      const fieldName = fieldMatch[1]!;
      const fieldType = fieldMatch[2]!;
      const refModel = fieldMatch[3];
      const isPrimaryKey = fieldName === "_id" || fieldName === "id";
      const isForeignKey = fieldType === "ObjectId" || !!refModel;
      columns.push({ name: fieldName, type: fieldType, isPrimaryKey, isForeignKey });

      if (refModel) {
        edges.push({
          fromId: `table_${schemaVar}`,
          toId: `table_${refModel}Schema`,
          label: "references",
          direction: "ONE_TO_MANY",
        });
      }
    }

    const simpleFieldRegex = /(\w+):\s*(String|Number|Boolean|Date|Buffer|Mixed|ObjectId|Array)/g;
    let simpleMatch: RegExpExecArray | null;
    while ((simpleMatch = simpleFieldRegex.exec(schemaBody)) !== null) {
      const fieldName = simpleMatch[1]!;
      const fieldType = simpleMatch[2]!;
      if (!columns.find((c) => c.name === fieldName)) {
        columns.push({
          name: fieldName,
          type: fieldType,
          isPrimaryKey: fieldName === "_id",
          isForeignKey: fieldType === "ObjectId",
        });
      }
    }

    models.set(schemaVar, columns);
  }

  const modelRegex =
    /mongoose\.model\s*\(\s*['"`](\w+)['"`]\s*,\s*(\w+)Schema\s*\)/g;
  let modelMatch: RegExpExecArray | null;

  while ((modelMatch = modelRegex.exec(content)) !== null) {
    const modelName = modelMatch[1]!;
    const schemaVar = modelMatch[2]!;
    if (models.has(schemaVar)) {
      const columns = models.get(schemaVar)!;
      models.delete(schemaVar);
      models.set(modelName, columns);
      edges.forEach((edge) => {
        if (edge.fromId === `table_${schemaVar}`) edge.fromId = `table_${modelName}`;
        if (edge.toId === `table_${schemaVar}`) edge.toId = `table_${modelName}`;
      });
    }
  }

  return { models, modelRelations, edges };
}

// ─── Knex Parser ──────────────────────────────────────────────────────────────

export function parseKnex(content: string): ERDResult {
  const models = new Map<string, TableColumn[]>();
  const modelRelations = new Map<string, RelationField[]>();
  const edges: DiagramEdge[] = [];

  const tableRegex =
    /(?:knex\.schema\.)?createTable\s*\(\s*['"`](\w+)['"`]\s*,\s*(?:function\s*\(|\()\s*(\w+)\s*\)\s*(?:=>)?\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;
  let tableMatch: RegExpExecArray | null;

  while ((tableMatch = tableRegex.exec(content)) !== null) {
    const tableName = tableMatch[1]!;
    const tableVar = tableMatch[2]!;
    const tableBody = tableMatch[3]!;
    const columns: TableColumn[] = [];

    const colRegex = new RegExp(
      `${tableVar}\\.(increments|integer|string|text|boolean|date|datetime|timestamp|json|uuid|binary|float|decimal|bigInteger)\\s*\\(\\s*['"\`]?(\\w+)['"\`]?`,
      "g",
    );
    let colMatch: RegExpExecArray | null;

    while ((colMatch = colRegex.exec(tableBody)) !== null) {
      const colType = colMatch[1]!;
      const colName = colMatch[2]!;

      const colDefRegex = new RegExp(
        `${tableVar}\\.${colType}\\s*\\(\\s*['"\`]?${colName}['"\`]?[^;]*`,
        "g",
      );
      const colDef = colDefRegex.exec(tableBody)?.[0] || "";

      const isPrimaryKey =
        /\.primary\(\)/.test(colDef) || colType === "increments" || colName === "id";
      const hasForeignKey = /\.references\(/.test(colDef);
      const isForeignKey = hasForeignKey || (colName.toLowerCase().endsWith("_id") && !isPrimaryKey);
      columns.push({ name: colName, type: colType, isPrimaryKey, isForeignKey });

      const fkMatch =
        /\.references\(\s*['"`](\w+)['"`]\s*\)\.inTable\(\s*['"`](\w+)['"`]\s*\)/.exec(colDef);
      if (fkMatch) {
        edges.push({
          fromId: `table_${tableName}`,
          toId: `table_${fkMatch[2]!}`,
          label: "references",
          direction: "ONE_TO_MANY",
        });
      }
    }

    models.set(tableName, columns);
  }

  return { models, modelRelations, edges };
}
