import { Parser } from "src/frontend/parser";
import { TruncateTableStatement } from "src/interfaces/ddl/truncate_statement_ast";
import { Token, TokenType } from "src/interfaces/token";

export class TruncateStatementParser extends Parser {
    public parse() : TruncateTableStatement {
        this.consume(TokenType.KEYWORD, 'TRUNCATE');
        this.consume(TokenType.KEYWORD, 'TABLE');
        let tables: Token[] = new Array<Token>();
        tables.push(this.consume(TokenType.IDENTIFIER));
        if (typeof(tables[0].value) !== "string") 
            throw new Error(`syntax error: expected identifier, got '${tables[0].value}'`);
        while (![TokenType.EOF, TokenType.SEMICOLON].includes(this.peek().type)) {
            this.consume(TokenType.COMMA);
            tables.push(this.consume(TokenType.IDENTIFIER));
        }
        if (this._cursor < this._length)
            throw new Error(`syntax error: unexpected token ${this.peek().value}, expected ; or EOF`);
        return {
            type: "TruncateTableStatement",
            tables: tables.map(t => {
                if (typeof(t.value) !== "string") 
                    throw new Error(`syntax error: expected identifier, got '${t.value}'`);
                return t.value;
            })
        }
    }
}