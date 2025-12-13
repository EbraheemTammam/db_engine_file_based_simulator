import { Parser } from "src/frontend/parser";
import { Token, TokenType } from "src/interfaces/token";
import { 
    AlterStatement, 
    AlterTableAddColumnStatement, 
    AlterTableAlterColumnDataTypeStatement, 
    AlterTableAlterColumnDefaultValueStatement, 
    AlterTableAlterColumnNotNullStatement, 
    AlterTableDropColumnStatement, 
    AlterTableRenameColumnStatement, 
    RenameDatabaseStatement,
    RenameIndexStatement
} from "src/interfaces/ddl/alter_statement_ast";

export class AlterStatementParser extends Parser {
    public parse() : AlterStatement {
        this.consume(TokenType.KEYWORD, 'ALTER');
        let next: Token = this.peek();
        switch (next.value) {
            case "DATABASE":
                return this.parse_rename_database();
            case "TABLE":
                return this.parse_alter_table();
            case "INDEX":
                return this.parse_rename_index();
            default:
                throw new Error(`syntax error: expected identifier, got '${next.value}'`);
        }
    }
    
    private parse_rename_database() : RenameDatabaseStatement {
        this.consume(TokenType.KEYWORD, 'DATABASE');
        let db_name = this.consume(TokenType.IDENTIFIER);
        if (typeof(db_name.value) !== "string")
            throw new Error(`syntax error: unexpected token '${db_name.value}', expected identifer`);
        this.consume(TokenType.KEYWORD, 'RENAME');
        this.consume(TokenType.KEYWORD, 'TO');
        let new_name = this.consume(TokenType.IDENTIFIER);
        if (typeof(new_name.value) !== "string")
            throw new Error(`syntax error: unexpected token '${new_name.value}', expected identifer`);
        return {
            type: "RenameDatabaseStatement",
            name: db_name.value,
            new_name: new_name.value
        }
    }
    
    private parse_alter_table() : AlterStatement {
        this.consume(TokenType.KEYWORD, 'TABLE');
        let table_name: Token = this.consume(TokenType.IDENTIFIER);
        if (typeof(table_name.value) !== "string")
            throw new Error(`syntax error: unexpected token '${table_name.value}', expected identifer`);
        let next: Token = this.peek();
        switch (next.value) {
            case 'ADD':
                return parse_alter_table_add_column(table_name);
            case 'DROP':
                return parse_alter_table_drop_column(table_name);
            case 'ALTER':
                return parse_alter_table_alter_column(table_name);
            case 'RENAME':
                return parse_rename_table(table_name);
            default:
                throw new Error(`syntax error: unexpected token '${next.value}', expected KEYWORD`);
        }
                    
        function parse_alter_table_add_column(table_name: Token) : AlterTableAddColumnStatement {
            if (typeof(table_name.value) !== "string") {
                throw new Error(`syntax error: unexpected token '${table_name.value}', expected identifer`);
            }
            this.consume(TokenType.KEYWORD, 'ADD');
            this.consume(TokenType.KEYWORD, 'COLUMN');
            let col_name: Token = this.consume(TokenType.IDENTIFIER);
            if (typeof(col_name.value) !== "string") 
                throw new Error(`syntax error: unexpected token ${col_name.value}, expected identifier`);
            let ctype: Token = this.consume(TokenType.TYPE);
            if (typeof(ctype.value) !== "string") 
                throw new Error(`syntax error: unexpected token ${ctype.value}, expected identifier`);
            let [pk, not_null, unique]: [boolean, boolean, boolean] = [false, false, false];
            let default_value: string | number | boolean | undefined;
            let reference: string | undefined;
            let column: AlterTableAddColumnStatement = {
                type: "AlterTableAddColumnStatement",
                name: table_name.value,
                column_name: col_name.value,
                data_type: ctype.value, 
            }
            let next: Token = this.peek();
            while (next.type !== TokenType.SEMICOLON) {
                switch (next.value) {
                    case 'PRIMARY':
                        this.consume(TokenType.KEYWORD, 'PRIMARY');
                        this.consume(TokenType.KEYWORD, 'KEY');
                        pk = true;
                        break;
                    case 'NOT':
                        this.consume(TokenType.KEYWORD, 'NOT');
                        this.consume(TokenType.NULL);
                        not_null = true;
                        break;
                    case 'UNIQUE':
                        this.consume(TokenType.KEYWORD, 'UNIQUE');
                        unique = true;
                        break;
                    case 'DEFAULT':
                        this.consume(TokenType.KEYWORD, 'DEFAULT');
                        default_value = this.consume().value;
                        break;
                    case 'REFERENCES':
                        this.consume(TokenType.KEYWORD, 'REFERENCES');
                        reference = [
                            this.consume(TokenType.IDENTIFIER).value, 
                            this.consume(TokenType.OPEN_PARAN, '(').value,
                            this.consume(TokenType.IDENTIFIER).value,
                            this.consume(TokenType.CLOSE_PARAN).value
                        ].join('');
                    default:
                        throw new Error(`syntax error: unexpected token '${next.value}'`);
                }
            }
            next = this.consume();
            column.constraints = {
                default: default_value,
                pk: pk,
                unique: (unique || pk), 
                not_null: not_null || pk,
                reference: reference
            }
            return column;
        }
    
        function parse_alter_table_drop_column(table_name: Token) : AlterTableDropColumnStatement {
            if (typeof(table_name.value) !== "string")
                throw new Error(`syntax error: unexpected token '${table_name.value}', expected identifer`);
            this.consume(TokenType.KEYWORD, 'DROP');
            this.consume(TokenType.KEYWORD, 'COLUMN');
            return {
                type: "AlterTableDropColumnStatement",
                name: table_name.value,
                column_name: this.consume(TokenType.IDENTIFIER).value
            }
        }

        function parse_alter_table_alter_column(table_name: Token) : AlterStatement {
            this.consume(TokenType.KEYWORD, 'ALTER');
            this.consume(TokenType.KEYWORD, 'COLUMN');
            let col_name: Token = this.consume(TokenType.IDENTIFIER);
            let behavior: Token = this.consume(TokenType.KEYWORD);
            let next: Token = this.peek();
            let statement: AlterStatement;
            switch (behavior.value) {
                case 'SET':
                    switch (next.value) {
                        case 'DATATYPE':
                            statement = parse_alter_table_alter_column_datatype(table_name, col_name);
                            break;
                        case 'DEFAULT':
                            statement = parse_alter_table_alter_column_default_value(table_name, col_name, true);
                            break;
                        case 'NOT':
                            statement = parse_alter_table_alter_column_not_null(table_name, col_name, true);
                            break;
                        default:
                            throw new Error(`syntax error: unexpected token '${next.value}', expected KEYWORD`);
                    }
                    break;
                case 'DROP':
                    switch (next.value) {
                        case 'DEFAULT':
                            statement = parse_alter_table_alter_column_default_value(table_name, col_name);
                            break;
                        case 'NOT':
                            statement = parse_alter_table_alter_column_not_null(table_name, col_name);
                            break;
                        default:
                            throw new Error(`syntax error: unexpected token '${next.value}', expected KEYWORD`);
                    }
                    break;
                default:
                    throw new Error(`syntax error: unexpected token '${behavior.value}', expected KEYWORD`);
            }
            next = this.peek();
            if ([TokenType.SEMICOLON, TokenType.EOF].includes(next.type))
                throw new Error(`syntax error: unexpected token ${next.value}, expected ; or EOF`);
            return statement;
    
            function parse_alter_table_alter_column_datatype(
                table_name: Token, col_name: Token
            ) : AlterTableAlterColumnDataTypeStatement {
                if (typeof(table_name.value) !== "string") 
                    throw new Error(`syntax error: unexpected ${table_name.value}, expected identifier`);
                if (typeof(col_name.value) !== "string") 
                    throw new Error(`syntax error: unexpected ${col_name.value}, expected identifier`);
                this.consume(TokenType.KEYWORD, 'DATATYPE');
                let datatype: Token = this.consume(TokenType.IDENTIFIER);
                if (typeof(datatype.value) !== "string") 
                    throw new Error(`syntax error: unexpected ${datatype.value}, expected identifier`);
                return {
                    type: "AlterTableAlterColumnDataTypeStatement",
                    name: table_name.value,
                    column_name: col_name.value,
                    data_type: datatype.value
                }
            }

            function parse_alter_table_alter_column_default_value(
                table_name: Token, col_name: Token, set_or_drop: boolean = false
            ) : AlterTableAlterColumnDefaultValueStatement {
                if (typeof(table_name.value) !== "string") 
                    throw new Error(`syntax error: unexpected ${table_name.value}, expected identifier`);
                if (typeof(col_name.value) !== "string") 
                    throw new Error(`syntax error: unexpected ${col_name.value}, expected identifier`);
                this.consume(TokenType.KEYWORD, 'DEFAULT');
                let statement: AlterTableAlterColumnDefaultValueStatement = {
                    type: "AlterTableAlterColumnDefaultValueStatement",
                    name: table_name.value,
                    column_name: col_name.value,
                    set_or_drop: set_or_drop
                }
                let default_value: Token;
                if (set_or_drop) {
                    default_value = this.consume(TokenType.IDENTIFIER)
                    if (typeof(default_value.value) !== "string") 
                        throw new Error(`syntax error: unexpected ${default_value.value}, expected identifier`);
                    statement.default_value = default_value.value
                }
                return statement;
            }

            function parse_alter_table_alter_column_not_null(
                table_name: Token, col_name:Token, set_or_drop: boolean = false
            ) : AlterTableAlterColumnNotNullStatement {
                if (typeof(table_name.value) !== "string") 
                    throw new Error(`syntax error: unexpected ${table_name.value}, expected identifier`);
                if (typeof(col_name.value) !== "string") 
                    throw new Error(`syntax error: unexpected ${col_name.value}, expected identifier`);
                this.consume(TokenType.KEYWORD, 'NOT');
                this.consume(TokenType.KEYWORD, 'NULL');
                return {
                    type: "AlterTableAlterColumnNotNullStatement",
                    name: table_name.value,
                    column_name: col_name.value,
                    set_or_drop: set_or_drop
                };
            }
        }

        function parse_rename_table(table_name: Token) : AlterTableRenameColumnStatement {
            if (typeof(table_name.value) !== "string")
                throw new Error(`syntax error: unexpected token '${table_name.value}', expected identifer`);
            this.consume(TokenType.KEYWORD, 'RENAME');
            this.consume(TokenType.KEYWORD, 'COLUMN');
            let old_name: Token = this.consume(TokenType.IDENTIFIER);
            if (typeof(old_name.value) !== "string")
                throw new Error(`syntax error: unexpected token '${old_name.value}', expected identifer`);
            let new_name: Token = this.consume(TokenType.IDENTIFIER);
            if (typeof(new_name.value) !== "string")
                throw new Error(`syntax error: unexpected token '${new_name.value}', expected identifer`);
            return {
                type: "AlterTableRenameColumnStatement",
                name: table_name.value,
                column_old_name: old_name.value,
                column_new_name: new_name.value
            }
        }
    }
    
    private parse_rename_index() : RenameIndexStatement {
        this.consume(TokenType.KEYWORD, 'INDEX');
        let idx_name = this.consume(TokenType.IDENTIFIER);
        if (typeof(idx_name.value) !== "string")
            throw new Error(`syntax error: unexpected token '${idx_name.value}', expected identifer`);
        this.consume(TokenType.KEYWORD, 'RENAME');
        this.consume(TokenType.KEYWORD, 'TO');
        let new_name = this.consume(TokenType.IDENTIFIER);
        if (typeof(new_name.value) !== "string")
            throw new Error(`syntax error: unexpected token '${new_name.value}', expected identifer`);
        return {
            type: "RenameIndexStatement",
            name: idx_name.value,
            new_name: new_name.value
        }
    }
}