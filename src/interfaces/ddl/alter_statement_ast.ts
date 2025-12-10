import { ASTNode } from "../ast"

export interface AlterStatement extends ASTNode {
    type: "AlterTableAddColumnStatement" | 
          "AlterTableAddConstraintStatement" | 
          "AlterTableDropColumnStatement" | 
          "AlterTableRenameColumnStatement" |
          "AlterTableAlterColumnDataType" |
          "AlterTableAlterColumnDefaultValue" |
          "AlterTableAlterColumnNotNull",
    name: string
}

export interface AlterTableAddColumnStatement extends AlterStatement {
    type: "AlterTableAddColumnStatement",
    column_name: string,
    data_type: string,
    constraints?: {
        default?: string | number | boolean,
        pk: boolean,
        unique: boolean,
        not_null: boolean,
        reference?: string
    }
}

export interface AlterTableDropColumnStatement extends AlterStatement {
    type: "AlterTableDropColumnStatement",
    column_name: string
}

export interface AlterTableRenameColumnStatement extends AlterStatement {
    type: "AlterTableRenameColumnStatement",
    column_old_name: string,
    column_new_name: string
}

export interface AlterTableAlterColumnStatement extends AlterStatement {
    column_name: string
}

export interface AlterTableAlterColumnDataTypeStatement extends AlterTableAlterColumnStatement {
    type: "AlterTableAlterColumnDataType",
    data_type: string
}

export interface AlterTableAlterColumnDefaultValueStatement extends AlterTableAlterColumnStatement {
    type: "AlterTableAlterColumnDefaultValue",
    set_or_drop: boolean,
    default_value?: string
}

export interface AlterTableAlterColumnNotNullStatement extends AlterStatement {
    type: "AlterTableAlterColumnNotNull",
    set_or_drop: boolean
}