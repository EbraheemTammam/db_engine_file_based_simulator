import { Parser } from "src/frontend/parser";
import { AlterStatement, AlterTableColumnStatement } from "src/interfaces/ddl/alter_statement_ast";
import { Token, TokenType } from "src/interfaces/token";

export class AlterTableParser extends Parser {
    parse() : AlterStatement {
        this.consume(TokenType.KEYWORD, 'ALTER');
        this.consume(TokenType.KEYWORD, 'TABLE');
        let table_name: Token = this.consume(TokenType.IDENTIFIER);
        if (typeof(table_name.value) !== "string")
            throw new Error(`syntax error: unexpected token '${table_name.value}', expected identifer`);
        let next: Token = this.peek();
        switch (next.value) {
            case 'ADD':
                return this.parse_alter_table_add_column(table_name);
            case 'DROP':
                return this.parse_alter_table_drop_column(table_name);
            case 'ALTER':
                return this.parse_alter_table_alter_column(table_name);
            case 'RENAME':
                return this.parse_rename_table(table_name);
            default:
                throw new Error(`syntax error: unexpected token '${next.value}', expected KEYWORD`);
        }
    }
                    
    private parse_alter_table_add_column(table_name: Token) : AlterTableColumnStatement {
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
        let column: AlterTableColumnStatement = {
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
    
    private parse_alter_table_drop_column(table_name: Token) : AlterTableColumnStatement {
        if (typeof(table_name.value) !== "string")
            throw new Error(`syntax error: unexpected token '${table_name.value}', expected identifer`);
        this.consume(TokenType.KEYWORD, 'DROP');
        this.consume(TokenType.KEYWORD, 'COLUMN');
        let column_name: Token = this.consume(TokenType.IDENTIFIER);
        if (typeof(column_name.value) !== "string") 
            throw new Error(`syntax error: unexpected token ${column_name.value}, expected identifier`);
        return {
            type: "AlterTableDropColumnStatement",
            name: table_name.value,
            column_name: column_name.value
        }
    }

    private parse_alter_table_alter_column(table_name: Token) : AlterStatement {
        this.consume(TokenType.KEYWORD, 'ALTER');
        this.consume(TokenType.KEYWORD, 'COLUMN');
        let col_name: Token = this.consume(TokenType.IDENTIFIER);
        let behavior: Token = this.consume(TokenType.KEYWORD);
        let next: Token = this.peek();
        switch (behavior.value) {
            case 'SET':
                switch (next.value) {
                    case 'DATATYPE':
                        return parse_alter_table_alter_column_datatype(this, table_name, col_name);
                    case 'DEFAULT':
                        return parse_alter_table_alter_column_default_value(this, table_name, col_name, true);
                    case 'NOT':
                        return parse_alter_table_alter_column_not_null(this, table_name, col_name, true);
                    default:
                        throw new Error(`syntax error: unexpected token '${next.value}', expected KEYWORD`);
                }
            case 'DROP':
                switch (next.value) {
                    case 'DEFAULT':
                        return parse_alter_table_alter_column_default_value(this, table_name, col_name);
                    case 'NOT':
                        return parse_alter_table_alter_column_not_null(this, table_name, col_name);
                    default:
                        throw new Error(`syntax error: unexpected token '${next.value}', expected KEYWORD`);
                }
            default:
                throw new Error(`syntax error: unexpected token '${behavior.value}', expected KEYWORD`);
        }

        function parse_alter_table_alter_column_datatype(
            self: AlterTableParser, table_name: Token, col_name: Token
        ) : AlterTableColumnStatement {
            if (typeof(table_name.value) !== "string") 
                throw new Error(`syntax error: unexpected ${table_name.value}, expected identifier`);
            if (typeof(col_name.value) !== "string") 
                throw new Error(`syntax error: unexpected ${col_name.value}, expected identifier`);
            self.consume(TokenType.KEYWORD, 'DATATYPE');
            let datatype: Token = self.consume(TokenType.IDENTIFIER);
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
            self: AlterTableParser, table_name: Token, col_name: Token, set_or_drop: boolean = false
        ) : AlterTableColumnStatement {
            if (typeof(table_name.value) !== "string") 
                throw new Error(`syntax error: unexpected ${table_name.value}, expected identifier`);
            if (typeof(col_name.value) !== "string") 
                throw new Error(`syntax error: unexpected ${col_name.value}, expected identifier`);
            self.consume(TokenType.KEYWORD, 'DEFAULT');
            let statement: AlterTableColumnStatement = {
                type: "AlterTableAlterColumnDefaultValueStatement",
                name: table_name.value,
                column_name: col_name.value,
                constraints: {
                    default: null
                }
            }
            let default_value: Token;
            if (set_or_drop) {
                default_value = self.consume(TokenType.IDENTIFIER)
                if (typeof(default_value.value) !== "string") 
                    throw new Error(`syntax error: unexpected ${default_value.value}, expected identifier`);
                statement.constraints!.default = default_value.value
            }
            return statement;
        }

        function parse_alter_table_alter_column_not_null(
            self: AlterTableParser, table_name: Token, col_name:Token, set_or_drop: boolean = false
        ) : AlterTableColumnStatement {
            if (typeof(table_name.value) !== "string") 
                throw new Error(`syntax error: unexpected ${table_name.value}, expected identifier`);
            if (typeof(col_name.value) !== "string") 
                throw new Error(`syntax error: unexpected ${col_name.value}, expected identifier`);
            self.consume(TokenType.KEYWORD, 'NOT');
            self.consume(TokenType.NULL);
            return {
                type: "AlterTableAlterColumnNotNullStatement",
                name: table_name.value,
                column_name: col_name.value,
                constraints: {
                    not_null: set_or_drop
                }
            };
        }
    }

    private parse_rename_table(table_name: Token) : AlterTableColumnStatement {
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
            column_name: old_name.value,
            new_name: new_name.value
        }
    }
}