import { ASTNode } from "../ast"

export interface AlterStatement extends ASTNode {
    type: "AlterTableAddColumnStatement" |
          "AlterTableDropColumnStatement" | 
          "AlterTableRenameColumnStatement" |
          "AlterTableAlterColumnDataTypeStatement" |
          "AlterTableAlterColumnDefaultValueStatement" |
          "AlterTableAlterColumnNotNullStatement" |
          "RenameDatabaseStatement" |
          "RenameTableStatement" |
          "RenameIndexStatement",
    name: string
}

export interface AlterTableColumnStatement extends AlterStatement {
    type: "AlterTableAddColumnStatement" |  
          "AlterTableDropColumnStatement" | 
          "AlterTableRenameColumnStatement" |
          "AlterTableAlterColumnDataTypeStatement" |
          "AlterTableAlterColumnDefaultValueStatement" |
          "AlterTableAlterColumnNotNullStatement",
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
    type: "RenameDatabaseStatement" | "RenameTableStatement" | "RenameIndexStatement",
    new_name: string
}