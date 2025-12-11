import { Token, TokenType } from "src/interfaces/token";
import { Parser } from "../parser";
import { SelectStatementParser } from "./dml/select_statement_parser";
import { InsertStatementParser } from "./dml/insert_statement_parser";
import { UpdateStatementParser } from "./dml/update statement_parser";
import { DeleteStatementParser } from "./dml/delete_statement_parser";

export class DMLParserFactory {
    private _lexemes: Token[];

    constructor(lexemes: Token[]) {
        this._lexemes = lexemes;
    }

    public build() : Parser {
        let peek: Token = this._lexemes[0];
        if (peek.type !== TokenType.KEYWORD)
            throw new Error(`syntax error: unexpected token ${peek.value}, expected a KEYWORD`)
        switch (peek.value) {
            case 'SELECT':
                return new SelectStatementParser(this._lexemes);
            case 'INSERT':
                return new InsertStatementParser(this._lexemes);
            case 'UPDATE':
                return new UpdateStatementParser(this._lexemes);
            case 'DELETE':
                return new DeleteStatementParser(this._lexemes);
            default:
                throw new Error(`syntax error: unexpected token '${peek.value}', expected a KEYWORD`);
        }
    }
}