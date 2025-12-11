import { Token, TokenType } from "src/interfaces/token";
import { Parser } from "../parser";
import { CreateStatementParser } from "./ddl/create_statement_parser";
import { AlterStatementParser } from "./ddl/alter_statement_parser";
import { DropStatementParser } from "./ddl/drop_statement_parser";
import { TruncateStatementParser } from "./ddl/truncate_statement_parser";

export class DDLParserFactory {
    private _lexemes: Token[];

    constructor(lexemes: Token[]) {
        this._lexemes = lexemes;
    }

    public build() : Parser {
        let peek: Token = this._lexemes[0];
        if (peek.type !== TokenType.KEYWORD)
            throw new Error(`syntax error: unexpected token ${peek.value}, expected a KEYWORD`)
        switch (peek.value) {
            case 'CREATE':
                return new CreateStatementParser(this._lexemes);
            case 'ALTER':
                return new AlterStatementParser(this._lexemes);
            case 'DROP':
                return new DropStatementParser(this._lexemes);
            case 'TRUNCATE':
                return new TruncateStatementParser(this._lexemes);
            default:
                throw new Error(`syntax error: unexpected token '${peek.value}', expected a KEYWORD`);
        }
    }
}