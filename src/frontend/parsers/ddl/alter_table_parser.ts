import { Parser } from "src/frontend/parser";
import { AlterStatement, AlterColumnStatement, RenameStatement } from "src/interfaces/ddl/alter_statement_ast";
import { Token, TokenType } from "src/interfaces/token";

export class AlterTableParser extends Parser {
    public override parse() : AlterStatement {
        this.consume(TokenType.KEYWORD, 'ALTER');
        this.consume(TokenType.KEYWORD, 'TABLE');
        let table_name: Token = this.consume(TokenType.IDENTIFIER);
        this.validate_token_datatype(table_name);
        let next: Token = this.peek();
        switch (next.value) {
            case 'ADD':
                return this.parse_add_column(table_name);
            case 'DROP':
                return this.parse_drop_column(table_name);
            case 'ALTER':
                return this.parse_alter_column(table_name);
            case 'RENAME':
                this.consume(TokenType.KEYWORD, 'RENAME');
                next = this.peek();
                return next.value === 'TO' ? 
                       this.parse_rename_table(table_name) : this.parse_rename_column(table_name);
            default:
                throw new SyntaxError(`unexpected token '${next.value}', expected KEYWORD`);
        }
    }
                    
    private parse_add_column(table_name: Token) : AlterColumnStatement {
        this.consume(TokenType.KEYWORD, 'ADD');
        this.consume(TokenType.KEYWORD, 'COLUMN');
        let col_name: Token = this.consume(TokenType.IDENTIFIER);
        this.validate_token_datatype(col_name);
        let ctype: Token = this.consume(TokenType.TYPE);
        this.validate_token_datatype(ctype);
        let [pk, not_null, unique]: [boolean, boolean, boolean] = [false, false, false];
        let default_value: string | number | boolean | undefined;
        let reference: string | undefined;
        let column: AlterColumnStatement = {
            type: "AlterColumnAdd",
            name: table_name.value as string,
            column_name: col_name.value as string,
            data_type: ctype.value as string 
        }
        let next: Token = this.peek();
        while (!this.is_eof() && next.type !== TokenType.SEMICOLON) {
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
                    throw new SyntaxError(`unexpected token '${next.value}'`);
            }
            next = this.peek();
        }
        column.constraints = {
            default: default_value,
            pk: pk,
            unique: (unique || pk), 
            not_null: not_null || pk,
            reference: reference
        }
        return column;
    }
    
    private parse_drop_column(table_name: Token) : AlterColumnStatement {
        this.consume(TokenType.KEYWORD, 'DROP');
        this.consume(TokenType.KEYWORD, 'COLUMN');
        let column_name: Token = this.consume(TokenType.IDENTIFIER);
        this.validate_token_datatype(column_name);
        return {
            type: "AlterColumnDrop",
            name: table_name.value as string,
            column_name: column_name.value as string
        }
    }

    private parse_alter_column(table_name: Token) : AlterStatement {
        this.consume(TokenType.KEYWORD, 'ALTER');
        this.consume(TokenType.KEYWORD, 'COLUMN');
        let col_name: Token = this.consume(TokenType.IDENTIFIER);
        this.validate_token_datatype(col_name);
        let behavior: Token = this.consume(TokenType.KEYWORD);
        let next: Token = this.peek();
        let statement: AlterStatement;
        switch (behavior.value) {
            case 'SET':
                switch (next.value) {
                    // case 'DATATYPE':
                    //     statement = parse_alter_column_datatype(this, table_name, col_name);
                    //     break;
                    case 'DEFAULT':
                        statement = parse_alter_column_default_value(this, table_name, col_name, true);
                        break;
                    // case 'NOT':
                    //     statement = parse_alter_column_not_null(this, table_name, col_name, true);
                    //     break;
                    default:
                        throw new SyntaxError(`unexpected token '${next.value}', expected KEYWORD`);
                }
                break;
            case 'DROP':
                switch (next.value) {
                    case 'DEFAULT':
                        statement = parse_alter_column_default_value(this, table_name, col_name);
                        break;
                    case 'NOT':
                        statement = parse_alter_column_not_null(this, table_name, col_name);
                        break;
                    default:
                        throw new SyntaxError(`unexpected token '${next.value}', expected KEYWORD`);
                }
                break;
            default:
                throw new SyntaxError(`unexpected token '${behavior.value}', expected KEYWORD`);
        }
        if (this._cursor < this._length && this._lexemes[this._cursor].type !== TokenType.EOF)
            throw new SyntaxError(`unexpected token ${this.peek().value}, expected ; or EOF`);
        return statement;

        function parse_alter_column_datatype(
            self: AlterTableParser, table_name: Token, col_name: Token
        ) : AlterColumnStatement {
            self.consume(TokenType.KEYWORD, 'DATATYPE');
            let datatype: Token = self.consume(TokenType.IDENTIFIER);
            self.validate_token_datatype(datatype);
            return {
                type: "AlterColumnDataType",
                name: table_name.value as string,
                column_name: col_name.value as string,
                data_type: datatype.value as string
            }
        }

        function parse_alter_column_default_value(
            self: AlterTableParser, table_name: Token, col_name: Token, set_or_drop: boolean = false
        ) : AlterColumnStatement {
            self.consume(TokenType.KEYWORD, 'DEFAULT');
            let statement: AlterColumnStatement = {
                type: "AlterColumnDefaultValue",
                name: table_name.value as string,
                column_name: col_name.value as string,
                constraints: {
                    default: null
                }
            }
            let default_value: Token;
            if (set_or_drop) {
                default_value = self.consume(TokenType.IDENTIFIER)
                if (typeof(default_value.value) !== "string") 
                    throw new SyntaxError(`unexpected ${default_value.value}, expected identifier`);
                statement.constraints!.default = default_value.value
            }
            return statement;
        }

        function parse_alter_column_not_null(
            self: AlterTableParser, table_name: Token, col_name:Token, set_or_drop: boolean = false
        ) : AlterColumnStatement {
            self.consume(TokenType.KEYWORD, 'NOT');
            self.consume(TokenType.NULL);
            return {
                type: "AlterColumnNotNull",
                name: table_name.value as string,
                column_name: col_name.value as string,
                constraints: {
                    not_null: set_or_drop
                }
            };
        }
    }

    private parse_rename_column(table_name: Token) : AlterColumnStatement {
        this.consume(TokenType.KEYWORD, 'COLUMN');
        let old_name: Token = this.consume(TokenType.IDENTIFIER);
        this.validate_token_datatype(old_name);
        this.consume(TokenType.KEYWORD, 'TO');
        let new_name: Token = this.consume(TokenType.IDENTIFIER);
        this.validate_token_datatype(new_name);
        return {
            type: "AlterColumnName",
            name: table_name.value as string,
            column_name: old_name.value as string,
            new_name: new_name.value as string
        }
    }

    private parse_rename_table(table_name: Token) : RenameStatement {
        this.consume(TokenType.KEYWORD, 'TO');
        let new_name = this.consume(TokenType.IDENTIFIER);
        this.validate_token_datatype(new_name);
        return {
            type: "AlterDatabaseName",
            name: table_name.value as string,
            new_name: new_name.value as string
        }
    }
}