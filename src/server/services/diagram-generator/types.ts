export interface TableColumn {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
}

export interface RelationField {
  name: string;
  targetModel: string;
  isArray: boolean;
  isOptional: boolean;
}

export interface ERDResult {
  models: Map<string, TableColumn[]>;
  modelRelations: Map<string, RelationField[]>;
  edges: import("@/features/diagram/types").DiagramEdge[];
}
