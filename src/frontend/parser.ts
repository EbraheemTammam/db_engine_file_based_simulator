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

    public abstract parse();

    protected peek() { return this._lexemes[this._cursor]; }

    protected consume(type?: TokenType, value?: string) : Token {
        if (this._cursor === this._length)
            throw new Error('unexpected end of input');
        let lexeme: Token = this.peek();
        if (type && lexeme.type !== type)
            throw new Error(`syntax error: unexpected token '${lexeme.value}', expected ${TokenType[type].toLowerCase()}`);
        if (value && lexeme.value?.toString().toUpperCase() !== value.toUpperCase())
            throw new Error(`syntax error: unexpected token '${lexeme.value}', expected ${value}`);
        ++this._cursor;
        return lexeme;
    }
}