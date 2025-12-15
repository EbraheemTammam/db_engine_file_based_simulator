import { ASTNode } from "../ast"

export interface AlterStatement extends ASTNode {
    type: "AlterColumnAdd" |
          "AlterColumnDrop" | 
          "AlterColumnName" |
          "AlterColumnDataType" |
          "AlterColumnDefaultValue" |
          "AlterColumnNotNull" |
          "AlterDatabaseName" |
          "AlterTableName" |
          "AlterIndexName",
    name: string
}

export interface AlterColumnStatement extends AlterStatement {
    type: "AlterColumnAdd" |  
          "AlterColumnDrop" | 
          "AlterColumnName" |
          "AlterColumnDataType" |
          "AlterColumnDefaultValue" |
          "AlterColumnNotNull",
    column_name: string,
    new_name?: string,
    data_type?: string,
    constraints?: {
        default?: string | number | boolean | null,
        pk?: boolean,
        unique?: boolean,
        not_null?: boolean,
        reference?: string
    }
}

export interface RenameStatement extends AlterStatement {
    type: "AlterDatabaseName" | "AlterTableName" | "AlterIndexName",
    new_name: string
}