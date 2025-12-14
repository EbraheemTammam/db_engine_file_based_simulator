import { Parser } from "src/frontend/parser";
import { Token, TokenType } from "src/interfaces/token";
import { 
    CreateDatabaseStatement, 
    CreateIndexStatement, 
    CreateStatement, 
    CreateTableColumnStatement, 
    CreateTableStatement 
} from "src/interfaces/ddl/create_statement_ast";

export class CreateStatementParser extends Parser {
    public parse() : CreateStatement {
        this.consume(TokenType.KEYWORD, 'CREATE');
        let next: Token = this.peek();
        let statement: CreateStatement;
        switch (next.value) {
            case "DATABASE":
                statement = this.parse_create_database();
                break;
            case "TABLE":
                statement = this.parse_create_table();
                break;
            case "INDEX":
                statement = this.parse_create_index();
                break;
            default:
                throw new Error(`syntax error: expected identifier, got ${next.value}`);
        }
        if (this._cursor < this._length)
            throw new Error(`syntax error: unexpected token ${this.peek().value}, expected ; or EOF`);
        return statement;
    }

    private parse_create_database() : CreateDatabaseStatement {
        this.consume(TokenType.KEYWORD, 'DATABASE');
        let identifier: Token = this.consume(TokenType.IDENTIFIER);
        if (typeof(identifier.value) !== "string")
            throw new Error(`syntax error: expected identifier, got ${identifier.value}`);
        let skip_if_exists: boolean = false;
        if (this.peek().value === 'IF') {
            this.consume(TokenType.KEYWORD, 'IF');
            this.consume(TokenType.KEYWORD, 'NOT');
            this.consume(TokenType.KEYWORD, 'EXISTS');
            skip_if_exists = true;
        }
        let statement: CreateDatabaseStatement = {
            type: 'CreateDatabaseStatement',
            name: identifier.value,
            skip_if_exists: skip_if_exists
        }
        if (this.peek().value === 'WITH') {
            this.consume(TokenType.KEYWORD, 'WITH');
            this.consume(TokenType.KEYWORD, 'OWNER');
            let owner: Token = this.consume(TokenType.IDENTIFIER);
            if (typeof(owner.value) !== "string")
                throw new Error(`syntax error: expected identifier, got ${owner.value}`);
            statement.options = {
                'owner': owner.value
            }
        }
        return statement;
    }

    private parse_create_table() : CreateTableStatement {
        this.consume(TokenType.KEYWORD, 'TABLE');
        let skip_if_exists: boolean = false;
        if (this.peek().value === 'IF') {
            this.consume(TokenType.KEYWORD, 'IF');
            this.consume(TokenType.KEYWORD, 'NOT');
            this.consume(TokenType.KEYWORD, 'EXISTS');
            skip_if_exists = true;
        }
        let table_name: Token = this.consume(TokenType.IDENTIFIER);
        if (typeof(table_name.value) !== "string") throw new Error(`syntax error: expected a string, got ${table_name.value}`)
        let columns: CreateTableColumnStatement[] = new Array<CreateTableColumnStatement>();
        let iterator: Token = this.consume(TokenType.OPEN_PARAN, '(');
        while (iterator.type !== TokenType.CLOSE_PARAN) {
            iterator = this.consume(TokenType.IDENTIFIER);
            if (typeof(iterator.value) !== "string") 
                throw new Error(`syntax error: unexpected token ${iterator.value}, expected identifier`)
            let ctype: Token = this.consume(TokenType.TYPE);
            if (typeof(ctype.value) !== "string") 
                throw new Error(`syntax error: unexpected token ${iterator.value}, expected identifier`)
            let [pk, not_null, unique]: [boolean, boolean, boolean] = [false, false, false];
            let default_value: string | number | boolean | undefined;
            let reference: string | undefined;
            let column: CreateTableColumnStatement = {
                name: iterator.value,
                data_type: ctype.value,
            }
            let next: Token;
            while (true) {
                next = this.peek();
                if ([TokenType.COMMA, TokenType.CLOSE_PARAN].includes(next.type)) break;
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
            iterator = this.consume();
            if (iterator.type === TokenType.COMMA && this.peek().type === TokenType.CLOSE_PARAN) 
                throw new Error(`syntax error: unexpected token '${iterator.value}', expected )`)
            column.constraints = {
                default: default_value,
                pk: pk,
                unique: (unique || pk), 
                not_null: not_null || pk,
                reference: reference
            }
            columns.push(column);
        }
        return {
            type: "CreateTableStatement",
            name: table_name.value,
            skip_if_exists: skip_if_exists,
            columns: columns
        }
    }

    private parse_create_index() : CreateIndexStatement {
        this.consume(TokenType.KEYWORD, 'INDEX');
        let skip_if_exists: boolean = false;
        if (this.peek().value == 'IF') {
            this.consume(TokenType.KEYWORD, 'IF');
            this.consume(TokenType.KEYWORD, 'NOT');
            this.consume(TokenType.KEYWORD, 'EXISTS');
            skip_if_exists = true;
        }
        let index_name: Token = this.consume(TokenType.IDENTIFIER);
        if (typeof(index_name.value) !== "string")
            throw new Error(`syntax error: unexpected token ${index_name.value}, expected identifier`);
        this.consume(TokenType.KEYWORD, 'ON');
        let table_name: Token = this.consume(TokenType.IDENTIFIER);
        if (typeof(table_name.value) !== "string")
            throw new Error(`syntax error: unexpected token ${table_name.value}, expected identifier`);
        this.consume(TokenType.OPEN_PARAN, '(');
        let cols: string[] = new Array<string>();
        while (true) {
            let col: Token = this.consume(TokenType.IDENTIFIER);
            if (typeof(col.value) !== "string")
                throw new Error(`syntax error: unexpected token ${col.value}, expected identifier`);
            cols.push(col.value);
            let next: Token = this.peek();
            if (next.type === TokenType.COMMA) {
                this.consume(TokenType.COMMA);
                continue;
            }
            else if (next.type === TokenType.CLOSE_PARAN) {
                this.consume(TokenType.CLOSE_PARAN);
                break;
            }
            else throw new Error(`syntax error: unexpected token ${next.value}, expected ')'`);
        }
        return {
            type: "CreateIndexStatement",
            name: index_name.value,
            table_name: table_name.value,
            columns: cols,
            skip_if_exists: skip_if_exists
        }
    }
}