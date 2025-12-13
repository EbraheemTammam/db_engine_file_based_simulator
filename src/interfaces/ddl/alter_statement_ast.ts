import { ASTNode } from "../ast"

export interface AlterStatement extends ASTNode {
    type: "AlterTableAddColumnStatement" | 
        //   "AlterTableAddConstraintStatement" | 
          "AlterTableDropColumnStatement" | 
          "AlterTableRenameColumnStatement" |
          "AlterTableAlterColumnDataTypeStatement" |
          "AlterTableAlterColumnDefaultValueStatement" |
          "AlterTableAlterColumnNotNullStatement" |
          "RenameDatabaseStatement" |
          "RenameIndexStatement",
    name: string
}

export interface AlterTableColumnStatement extends AlterStatement {
    type: "AlterTableAddColumnStatement" | 
        //   "AlterTableAddConstraintStatement" | 
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

export interface RenameDatabaseStatement extends AlterStatement {
    type: "RenameDatabaseStatement",
    new_name: string
}

export interface RenameIndexStatement extends AlterStatement {
    type: "RenameIndexStatement",
    new_name: string
}