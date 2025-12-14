import { Parser } from "src/frontend/parser";
import { InsertStatement, value } from "src/interfaces/dml/insert_statement_ast";
import { Token, TokenType } from "src/interfaces/token";

export class InsertStatementParser extends Parser {
    parse() : InsertStatement {
        this.consume(TokenType.KEYWORD, 'INSERT');
        this.consume(TokenType.KEYWORD, 'INTO');
        let table_name: Token = this.consume(TokenType.IDENTIFIER);
        if (typeof(table_name.value) !== "string")
            throw new SyntaxError(`unexpected token ${table_name.value}, expected identifier`);
        let statement: InsertStatement = {
            type: "InsertStatement",
            table: table_name.value,
            values: new Array<Array<value>>()
        }
        if (this.peek().type === TokenType.OPEN_PARAN) {
            this.consume(TokenType.OPEN_PARAN);
            statement.columns = new Array<string>();
            let col: Token = this.consume(TokenType.IDENTIFIER);
            if (typeof(col.value) !== "string")
                throw new SyntaxError(`unexpected token ${col.value}, expected identifier`);
            statement.columns.push(col.value);
            while (this.peek().type !== TokenType.CLOSE_PARAN) {
                this.consume(TokenType.COMMA);
                col = this.consume(TokenType.IDENTIFIER);
                if (typeof(col.value) !== "string")
                    throw new SyntaxError(`unexpected token ${col.value}, expected identifier`);
                statement.columns.push(col.value);
            }
            this.consume(TokenType.CLOSE_PARAN);
        }
        this.consume(TokenType.KEYWORD, 'VALUES');
        while (!this.is_eof()) {
            this.consume(TokenType.OPEN_PARAN);
            statement.values.push(new Array<value>());
            let value: Token = this.consume();
            if (value.value === undefined) 
                throw new SyntaxError(`unexpected token ${value.type}, expected value`);
            statement.values[statement.values.length - 1].push(value.value)
            while (this.peek().type !== TokenType.CLOSE_PARAN) {
                this.consume(TokenType.COMMA);
                value = this.consume();
                if (value.value === undefined) 
                    throw new SyntaxError(`unexpected token ${value.type}, expected value`);
                statement.values[statement.values.length - 1].push(value.value);
            }
            this.consume(TokenType.CLOSE_PARAN);
            if (this.is_eof() || this.peek().type !== TokenType.COMMA) break;
            this.consume(TokenType.COMMA);
        }
        return statement;
    }
}