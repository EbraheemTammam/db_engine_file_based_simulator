import { Parser } from "src/frontend/parser";
import { SelectStatement } from "src/interfaces/dml/select_statement_ast";
import { Token, TokenType } from "src/interfaces/token";
import { LogicalConditionParser } from "./logical_condition_parser";

export class SelectStatementParser extends Parser {
    parse() : SelectStatement {
        this.consume(TokenType.KEYWORD, 'SELECT');
        let distinct: boolean = false;
        if (this.peek().type === TokenType.KEYWORD) {
            let behavior: Token = this.consume(TokenType.KEYWORD);
            if (behavior.value === 'DISTINCT')
                distinct = true;
        }
        let columns: Array<Token> = new Array<Token>();
        while (true) {
            const col: Token = this.consume();
            if (
                !(
                    col.type === TokenType.IDENTIFIER ||
                    (col.type === TokenType.OPERATOR && col.value === "*")
                )
            ) throw new SyntaxError(`unexpected token ${col.value}, expected * or identifier`);
            columns.push(col);
            if (this.peek().type !== TokenType.COMMA) break;
            this.consume(TokenType.COMMA);
        }
        this.consume(TokenType.KEYWORD, 'FROM');
        let table: Token = this.consume(TokenType.IDENTIFIER);
        this.validate_token_datatype(table);
        let statement: SelectStatement = {
            type: "Select",
            table: table.value as string,
            distinct: distinct,
            columns: columns.map(c => {
                this.validate_token_datatype(c);
                return c.value as string
            }),
            grouping: new Array<string>(),
            ordering: new Array<string>()
        }
        while (!this.is_eof()) {
            let keyword: Token = this.consume(TokenType.KEYWORD);
            switch (keyword.value) {
                case 'WHERE':
                    statement.condition = (new LogicalConditionParser(this._lexemes.slice(this._cursor - 1))).parse();
                    this._cursor += 3;
                    break;
                case 'GROUP':
                    this.consume(TokenType.KEYWORD, 'BY');
                    let group: Token = this.consume(TokenType.IDENTIFIER);
                    this.validate_token_datatype(group);
                    statement.grouping?.push(group.value as string);
                    while (this.peek().type === TokenType.COMMA) {
                        this.consume(TokenType.COMMA);
                        group = this.consume(TokenType.IDENTIFIER);
                        this.validate_token_datatype(group);
                        statement.grouping?.push(group.value as string);
                    }
                    break;
                case 'ORDER':
                    this.consume(TokenType.KEYWORD, 'BY');
                    let order: Token = this.consume(TokenType.IDENTIFIER);
                    this.validate_token_datatype(order);
                    statement.ordering?.push(order.value as string);
                    while (this.peek().type === TokenType.COMMA) {
                        this.consume(TokenType.COMMA);
                        order = this.consume(TokenType.IDENTIFIER);
                        this.validate_token_datatype(order);
                        statement.ordering?.push(order.value as string);
                    }
                    break;
                case 'LIMIT':
                    let limit: Token = this.consume(TokenType.NUMBER);
                    this.validate_token_datatype(limit, "number", "a number");
                    statement.limit = limit.value as number;
                    break;
                default:
                    throw new SyntaxError(`unexpected token ${keyword.value}, expected a KEYWORD`);
            }
        }
        return statement;
    }
}