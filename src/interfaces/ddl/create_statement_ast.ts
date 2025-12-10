import { ASTNode } from "../ast"

export interface CreateStatement extends ASTNode {
    type: "CreateDatabaseStatement" | "CreateTableStatement" | "CreateIndexStatement",
    name: string,
    skip_if_exists: boolean
}

export interface CreateDatabaseStatement extends CreateStatement {
    type: "CreateDatabaseStatement",
    options?: {
        owner: string
    }
}

export interface CreateTableColumnStatement {
    name: string,
    data_type: string,
    constraints?: {
        default?: string | number | boolean,
        pk: boolean,
        serial: boolean,
        unique: boolean,
        not_null: boolean,
        reference?: string
    }   
}

export interface CreateTableStatement extends CreateStatement {
    type: "CreateTableStatement",
    columns: CreateTableColumnStatement[]
}

export interface CreateIndexStatement extends CreateStatement {
    type: "CreateIndexStatement",
    table_name: string,
    columns: string[]
}
