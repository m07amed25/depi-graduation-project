import type { DiagramEdge } from "@/features/diagram/types";
import type { ERDResult, TableColumn, RelationField } from "./types";

// ─── Prisma Parser ────────────────────────────────────────────────────────────

export function parsePrismaSchema(content: string): ERDResult {
  const models = new Map<string, TableColumn[]>();
  const modelRelations = new Map<string, RelationField[]>();
  const edges: DiagramEdge[] = [];

  function extractModelBlocks(
    schema: string,
  ): Array<{ name: string; body: string }> {
    const results: Array<{ name: string; body: string }> = [];
    const headerRegex = /model\s+(\w+)\s*\{/g;
    let header: RegExpExecArray | null;
    while ((header = headerRegex.exec(schema)) !== null) {
      const modelName = header[1]!;
      const openBrace = header.index + header[0].length - 1;
      let depth = 1;
      let i = openBrace + 1;
      while (i < schema.length && depth > 0) {
        if (schema[i] === "{") depth++;
        else if (schema[i] === "}") depth--;
        i++;
      }
      results.push({ name: modelName, body: schema.slice(openBrace + 1, i - 1) });
    }
    return results;
  }

  const modelBlocks = extractModelBlocks(content);
  const allModelNames = new Set(modelBlocks.map((b) => b.name));

  for (const { name: modelName, body: modelBody } of modelBlocks) {
    const columns: TableColumn[] = [];
    const relations: RelationField[] = [];

    for (const line of modelBody.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("@@")) continue;

      const fieldMatch = /^(\w+)\s+([\w?[\]]+)/.exec(trimmed);
      if (fieldMatch) {
        const fieldName = fieldMatch[1]!;
        const fieldType = fieldMatch[2]!;
        const baseType = fieldType.replace(/[?[\]]/g, "");
        const isPrimitive =
          /^(String|Int|Float|Boolean|DateTime|Json|BigInt|Decimal|Bytes)/.test(fieldType);

        if (!isPrimitive) {
          if (allModelNames.has(baseType)) {
            relations.push({
              name: fieldName,
              targetModel: baseType,
              isArray: fieldType.includes("[]"),
              isOptional: fieldType.endsWith("?"),
            });
          }
          continue;
        }

        const isPrimaryKey = trimmed.includes("@id");
        const isForeignKey = fieldName.endsWith("Id") && !isPrimaryKey;
        columns.push({ name: fieldName, type: baseType, isPrimaryKey, isForeignKey });
      }
    }

    models.set(modelName, columns);
    if (relations.length > 0) modelRelations.set(modelName, relations);
  }

  const edgeKey = (a: string, b: string) => [a, b].sort().join("__");
  const processedEdgePairs = new Map<string, { fromId: string; toId: string; fromIsArray: boolean }>();

  for (const { name: modelName, body: modelBody } of modelBlocks) {
    for (const line of modelBody.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("@@")) continue;
      if (trimmed.includes("@relation")) {
        const fieldMatch = /^(\w+)\s+([\w\[\]?]+)/.exec(trimmed);
        if (fieldMatch) {
          const relType = fieldMatch[2]!;
          const isArray = relType.includes("[]");
          const targetModel = relType.replace(/[\[\]?]/g, "");
          if (models.has(targetModel)) {
            const key = edgeKey(modelName, targetModel);
            if (processedEdgePairs.has(key)) {
              const existing = processedEdgePairs.get(key)!;
              if (isArray && existing.fromIsArray) {
                const existingEdge = edges.find(
                  (e) => e.fromId === existing.fromId && e.toId === existing.toId,
                );
                if (existingEdge) {
                  existingEdge.direction = "MANY_TO_MANY";
                  existingEdge.label = "many to many";
                }
              }
            } else {
              processedEdgePairs.set(key, {
                fromId: `table_${modelName}`,
                toId: `table_${targetModel}`,
                fromIsArray: isArray,
              });
              edges.push({
                fromId: `table_${modelName}`,
                toId: `table_${targetModel}`,
                label: isArray ? "has many" : "has one",
                direction: isArray ? "ONE_TO_MANY" : "ONE_TO_ONE",
              });
            }
          }
        }
      }
    }
  }

  return { models, modelRelations, edges };
}

// ─── SQL DDL Parser ───────────────────────────────────────────────────────────

export function parseSQLDDL(content: string): ERDResult {
  const models = new Map<string, TableColumn[]>();
  const modelRelations = new Map<string, RelationField[]>();
  const edges: DiagramEdge[] = [];

  const tableRegex =
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`|"|')?(\w+)(?:`|"|')?\s*\(([\s\S]*?)\);/gi;
  let tableMatch: RegExpExecArray | null;

  while ((tableMatch = tableRegex.exec(content)) !== null) {
    const tableName = tableMatch[1]!;
    const tableBody = tableMatch[2]!;
    const columns: TableColumn[] = [];
    const foreignKeys: Array<{ from: string; to: string; toColumn: string }> = [];
    const parts = tableBody.split(/,(?![^(]*\))/);

    for (const part of parts) {
      const trimmed = part.trim();
      const colMatch =
        /^(?:`|"|')?(\w+)(?:`|"|')?\s+([\w()]+)(?:\s+(?:PRIMARY\s+KEY|NOT\s+NULL|NULL|AUTO_INCREMENT|DEFAULT\s+.+?))*$/i.exec(trimmed);
      if (colMatch) {
        const colName = colMatch[1]!;
        const colType = colMatch[2]!.replace(/[()0-9]/g, "").toUpperCase();
        const isPrimaryKey = /PRIMARY\s+KEY/i.test(trimmed) || /\bid\b/i.test(colName);
        const isForeignKey = colName.toLowerCase().endsWith("_id");
        columns.push({ name: colName, type: colType, isPrimaryKey, isForeignKey });
      }
      const fkMatch =
        /FOREIGN\s+KEY\s*\((?:`|"|')?(\w+)(?:`|"|')?\)\s*REFERENCES\s+(?:`|"|')?(\w+)(?:`|"|')?\s*\((?:`|"|')?(\w+)(?:`|"|')?\)/i.exec(trimmed);
      if (fkMatch) {
        foreignKeys.push({ from: fkMatch[1]!, to: fkMatch[2]!, toColumn: fkMatch[3]! });
      }
    }

    models.set(tableName, columns);
    for (const fk of foreignKeys) {
      edges.push({
        fromId: `table_${tableName}`,
        toId: `table_${fk.to}`,
        label: "references",
        direction: "ONE_TO_MANY",
      });
    }
  }

  return { models, modelRelations, edges };
}

// ─── TypeORM Parser ───────────────────────────────────────────────────────────

export function parseTypeORM(content: string): ERDResult {
  const models = new Map<string, TableColumn[]>();
  const modelRelations = new Map<string, RelationField[]>();
  const edges: DiagramEdge[] = [];

  const entityRegex = /@Entity\s*\([^)]*\)?\s*export\s+class\s+(\w+)/g;
  const entities: string[] = [];
  let entityMatch: RegExpExecArray | null;
  while ((entityMatch = entityRegex.exec(content)) !== null) {
    entities.push(entityMatch[1]!);
  }

  for (const entityName of entities) {
    const columns: TableColumn[] = [];
    const classRegex = new RegExp(`class\\s+${entityName}[^{]*\\{([\\s\\S]*?)\\n\\}`, "m");
    const classMatch = classRegex.exec(content);
    if (!classMatch) continue;
    const classBody = classMatch[1]!;

    const columnRegex =
      /@(PrimaryGeneratedColumn|PrimaryColumn|Column|CreateDateColumn|UpdateDateColumn)\s*\([^)]*\)?\s*(\w+)(?:\?)?:\s*([\w<>\[\]]+)/g;
    let colMatch: RegExpExecArray | null;
    while ((colMatch = columnRegex.exec(classBody)) !== null) {
      const decorator = colMatch[1]!;
      const colName = colMatch[2]!;
      const colType = colMatch[3]!.replace(/[<>\[\]]/g, "");
      const isPrimaryKey = decorator === "PrimaryGeneratedColumn" || decorator === "PrimaryColumn";
      const isForeignKey = colName.toLowerCase().endsWith("id") && !isPrimaryKey;
      columns.push({ name: colName, type: colType, isPrimaryKey, isForeignKey });
    }

    const relationRegex =
      /@(OneToOne|OneToMany|ManyToOne|ManyToMany)\s*\(\s*\(\)\s*=>\s*(\w+)/g;
    let relMatch: RegExpExecArray | null;
    while ((relMatch = relationRegex.exec(classBody)) !== null) {
      const relationType = relMatch[1]!;
      const targetEntity = relMatch[2]!;
      if (entities.includes(targetEntity)) {
        let direction: DiagramEdge["direction"] = "ASSOCIATES";
        let label = "relates to";
        switch (relationType) {
          case "OneToOne": direction = "ONE_TO_ONE"; label = "one to one"; break;
          case "OneToMany": direction = "ONE_TO_MANY"; label = "has many"; break;
          case "ManyToOne": direction = "ONE_TO_MANY"; label = "belongs to"; break;
          case "ManyToMany": direction = "MANY_TO_MANY"; label = "many to many"; break;
        }
        edges.push({ fromId: `table_${entityName}`, toId: `table_${targetEntity}`, label, direction });
      }
    }

    models.set(entityName, columns);
  }

  return { models, modelRelations, edges };
}

// ─── Sequelize Parser ─────────────────────────────────────────────────────────

export function parseSequelize(content: string): ERDResult {
  const models = new Map<string, TableColumn[]>();
  const modelRelations = new Map<string, RelationField[]>();
  const edges: DiagramEdge[] = [];

  const defineRegex =
    /(?:sequelize\.define|Model\.init)\s*\(\s*['"`](\w+)['"`]\s*,\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;
  let defineMatch: RegExpExecArray | null;

  while ((defineMatch = defineRegex.exec(content)) !== null) {
    const modelName = defineMatch[1]!;
    const modelBody = defineMatch[2]!;
    const columns: TableColumn[] = [];

    const colRegex =
      /(\w+):\s*\{[^}]*type:\s*DataTypes\.(\w+)(?:[^}]*primaryKey:\s*true)?(?:[^}]*references:\s*\{[^}]*model:\s*['"`](\w+)['"`])?/g;
    let colMatch: RegExpExecArray | null;
    while ((colMatch = colRegex.exec(modelBody)) !== null) {
      const colName = colMatch[1]!;
      const colType = colMatch[2]!;
      const isPrimaryKey = /primaryKey:\s*true/.test(colMatch[0]);
      const referencedModel = colMatch[3];
      const isForeignKey = !!referencedModel || (colName.toLowerCase().endsWith("id") && !isPrimaryKey);
      columns.push({ name: colName, type: colType, isPrimaryKey, isForeignKey });
      if (referencedModel) {
        edges.push({ fromId: `table_${modelName}`, toId: `table_${referencedModel}`, label: "references", direction: "ONE_TO_MANY" });
      }
    }
    models.set(modelName, columns);
  }

  const assocRegex = /(\w+)\.(hasMany|belongsTo|hasOne|belongsToMany)\s*\(\s*(\w+)/g;
  let assocMatch: RegExpExecArray | null;
  while ((assocMatch = assocRegex.exec(content)) !== null) {
    const fromModel = assocMatch[1]!;
    const assocType = assocMatch[2]!;
    const toModel = assocMatch[3]!;
    let direction: DiagramEdge["direction"] = "ASSOCIATES";
    let label = "relates to";
    switch (assocType) {
      case "hasMany": direction = "ONE_TO_MANY"; label = "has many"; break;
      case "hasOne": direction = "ONE_TO_ONE"; label = "has one"; break;
      case "belongsTo": direction = "ONE_TO_MANY"; label = "belongs to"; break;
      case "belongsToMany": direction = "MANY_TO_MANY"; label = "many to many"; break;
    }
    if (models.has(fromModel) && models.has(toModel)) {
      edges.push({ fromId: `table_${fromModel}`, toId: `table_${toModel}`, label, direction });
    }
  }

  return { models, modelRelations, edges };
}
