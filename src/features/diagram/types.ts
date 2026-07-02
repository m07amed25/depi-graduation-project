export type DiagramType = "ERD";

export type DiagramStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface DiagramNodeDetailTable {
  columns: Array<{
    name: string;
    type: string;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
  }>;
  /** Relation / association fields (not shown as columns in the ERD but shown in the detail panel) */
  relations?: Array<{
    name: string;
    targetModel: string;
    isArray: boolean;
    isOptional: boolean;
  }>;
  /** Optional extra metadata (indexes, uniques, etc.) */
  attributes?: string[];
}

export type DiagramNodeDetail = DiagramNodeDetailTable;

export interface DiagramNode {
  id: string;
  label: string;
  type: "TABLE";
  detail: DiagramNodeDetail;
  /** Set when the node first appeared in the latest regeneration (for highlighting). */
  isNew?: boolean;
}

export interface DiagramEdge {
  fromId: string;
  toId: string;
  label: string;
  direction:
    | "ONE_TO_ONE"
    | "ONE_TO_MANY"
    | "MANY_TO_MANY"
    | "INHERITS"
    | "IMPLEMENTS"
    | "COMPOSES"
    | "AGGREGATES"
    | "ASSOCIATES"
    | "DEPENDS"
    | "INCLUDES"
    | "EXTENDS";
}

export interface DiagramTriggerRule {
  type: DiagramType;
  patterns: string[];
}
