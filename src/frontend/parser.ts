import { ASTNode } from "src/interfaces/ast";
import { IParser } from "src/interfaces/parser";
import { Token, TokenType } from "src/interfaces/token";

export abstract class Parser implements IParser {
    protected _lexemes: Token[];
    protected _cursor: number;
    protected _length: number;

    constructor(tokens: Token[]) {
        this._lexemes = tokens;
        this._cursor = 0;
        this._length = tokens.length;
    }

    public abstract parse() : ASTNode ;

    protected peek() : Token { return this._lexemes[this._cursor]; }

    protected consume(type?: TokenType, value?: string) : Token {
        if (this._cursor === this._length)
            throw new Error('unexpected end of input');
        let lexeme: Token = this.peek();
        // console.log(`extected type: ${TokenType[type!]}, found ${TokenType[lexeme.type]}`);
        // console.log(`extected value: ${value}, found ${lexeme.value}\n`);
        if (type && lexeme.type !== type)
            throw new Error(`syntax error: unexpected token '${lexeme.value}', expected ${TokenType[type].toLowerCase()}`);
        if (value && lexeme.value?.toString().toUpperCase() !== value.toUpperCase())
            throw new Error(`syntax error: unexpected token '${lexeme.value}', expected ${value}`);
        ++this._cursor;
        return lexeme;
    }

    protected is_eof() : boolean {
        return this._cursor === this._length || this.peek().type == TokenType.EOF;
    }
}