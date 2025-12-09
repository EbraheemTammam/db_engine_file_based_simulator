export interface ASTNode {
    type: string
}

export interface CreateDatabaseStatement extends ASTNode {
    type: "CreateDatabaseStatement",
    database_name: string,
    options: {
        owner: string
    }
}

export interface CreateTableColumnStatement {
    name: string,
    type: string,
    constraints: {
        default?: string | number | boolean,
        pk: boolean,
        serial: boolean,
        unique: boolean,
        not_null: boolean,
        reference?: string
    }   
}

export interface CreateTableStatement extends ASTNode {
    type: "CreateTableStatement",
    table_name: string,
    skip_if_exists: boolean,
    columns: CreateTableColumnStatement[]
}
