import { Parser } from "src/frontend/parser";
import { Token, TokenType } from "src/interfaces/token";
import { 
    AlterStatement,
    RenameDatabaseStatement,
    RenameIndexStatement
} from "src/interfaces/ddl/alter_statement_ast";
import { AlterTableParser } from "./alter_table_parser";

export class AlterStatementParser extends Parser {
    public parse() : AlterStatement {
        this.consume(TokenType.KEYWORD, 'ALTER');
        let next: Token = this.peek();
        let statement: AlterStatement;
        switch (next.value) {
            case "DATABASE":
                statement = this.parse_rename_database();
                break;
            case "TABLE":
                return (new AlterTableParser(this._lexemes)).parse();
            case "INDEX":
                statement = this.parse_rename_index();
                break;
            default:
                throw new SyntaxError(`expected identifier, got '${next.value}'`);
        }
        if (this._cursor < this._length && this._lexemes[this._cursor].type !== TokenType.EOF)
            throw new SyntaxError(`unexpected token ${this.peek().value}, expected ; or EOF`);
        return statement;
    }
    
    private parse_rename_database() : RenameDatabaseStatement {
        this.consume(TokenType.KEYWORD, 'DATABASE');
        let db_name = this.consume(TokenType.IDENTIFIER);
        if (typeof(db_name.value) !== "string")
            throw new SyntaxError(`unexpected token '${db_name.value}', expected identifer`);
        this.consume(TokenType.KEYWORD, 'RENAME');
        this.consume(TokenType.KEYWORD, 'TO');
        let new_name = this.consume(TokenType.IDENTIFIER);
        if (typeof(new_name.value) !== "string")
            throw new SyntaxError(`unexpected token '${new_name.value}', expected identifer`);
        return {
            type: "RenameDatabaseStatement",
            name: db_name.value,
            new_name: new_name.value
        }
    }
    
    private parse_rename_index() : RenameIndexStatement {
        this.consume(TokenType.KEYWORD, 'INDEX');
        let idx_name = this.consume(TokenType.IDENTIFIER);
        if (typeof(idx_name.value) !== "string")
            throw new SyntaxError(`unexpected token '${idx_name.value}', expected identifer`);
        this.consume(TokenType.KEYWORD, 'RENAME');
        this.consume(TokenType.KEYWORD, 'TO');
        let new_name = this.consume(TokenType.IDENTIFIER);
        if (typeof(new_name.value) !== "string")
            throw new SyntaxError(`unexpected token '${new_name.value}', expected identifer`);
        return {
            type: "RenameIndexStatement",
            name: idx_name.value,
            new_name: new_name.value
        }
    }
}