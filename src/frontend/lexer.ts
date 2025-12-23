import { KEYWORDS } from "src/constants/keywords";
import { TYPES } from "src/constants/types";
import { Token, TokenType } from "src/interfaces/token";

export class Lexer {
    private _tokens: Token[];
    private _buffer: string;
    private _buffer_size: number;
    private _cursor: number;

    constructor(buffer: string) {
        this._buffer = buffer;
        this._buffer_size = buffer.length;
        this._cursor = 0;
        this._tokens = new Array<Token>();
    }

    public tokenize() : Token[] {
        /*
            I'm tryna handle each type of
            token types i've set in token.ts
            file here and i got a bunch of them
            -- 
            keyword, identity, operator, comment, end of file
            literal (string, number, boolean, null), 
            punctuation (comma, dot, semicolon, open paran, closed paran),
            (
                i think this is going out of 
                control somehow and i should've
                stucked to bruteforcing string
                buffers but i'm gonna try anyway
            )
        */
        let char: string;
        
        while (true) {
            
            if (this._cursor >= this._buffer_size) {
                this._tokens.push({'type': TokenType.EOF});
                break;
            }

            // comments
            if (this._buffer.slice(this._cursor, this._cursor + 2) === '--') {
                this._cursor += 2;
                let iterator = this._cursor;
                while(iterator !== this._buffer_size && this._buffer[iterator + 1] !== '\n') ++iterator;
                this._tokens.push({'type': TokenType.COMMENT, 'value': this._buffer.slice(this._cursor, iterator + 1)});
                this._cursor = iterator + 1;
                continue;
            }
            if (this._buffer.slice(this._cursor, this._cursor + 2) === '/*') {
                this._cursor += 2;
                let iterator = this._cursor;
                while(
                    iterator !== this._buffer_size && 
                    this._buffer[iterator + 1] !== '*' && 
                    this._buffer[iterator + 2] !== '/'
                ) 
                    ++iterator;
                this._tokens.push({'type': TokenType.COMMENT, 'value': this._buffer.slice(this._cursor, iterator + 1)});
                this._cursor = iterator + 3;
                continue;
            }
            
            char = this._buffer[this._cursor];

            // whitespace
            if ([' ', '\n', '\t', '\r'].includes(char)) {
                ++this._cursor;
                continue;
            }
            
            // string literal
            if (char === '"' || char === "'") {
                this._tokenize_string_literal(char);
                continue;
            }
            
            // number literal
            if (Lexer.is_number(char)) {
                this._tokenize_number_literal();
                continue;
            }

            // null literal
            if (
                this._cursor <= this._buffer_size - 4 &&
                this._buffer.slice(this._cursor, this._cursor + 4).toUpperCase() === 'NULL'
            ) {
                this._tokens.push({'type': TokenType.NULL})
                this._cursor += 4;
                continue;
            }

            // boolean literal
            if (
                this._cursor < this._buffer_size - 4 &&
                this._buffer.slice(this._cursor, this._cursor + 4).toUpperCase() === 'TRUE'
            ) {
                this._tokens.push({'type': TokenType.BOOLEAN, 'value': true});
                this._cursor += 4;
                continue;
            }
            else if (
                this._cursor < this._buffer_size - 5 &&
                this._buffer.slice(this._cursor, this._cursor + 5).toUpperCase() === 'FALSE'
            ) {
                this._tokens.push({'type': TokenType.BOOLEAN, 'value': false});
                this._cursor += 5;
                continue;
            }

            // identity or keyword
            if (Lexer.is_alpha(char)) {
                this._tokenize_identity_or_keyword_or_type();
                continue;
            }

            // operators
            if (
                this._cursor < this._buffer_size - 1 &&
                ["!=", "<>", "<=", ">=", "||"].includes(this._buffer.slice(this._cursor, this._cursor + 2))
            ) {
                this._tokens.push(
                    {
                        'type': TokenType.OPERATOR, 
                        'value': this._buffer.slice(this._cursor, this._cursor + 2)
                    }
                );
                this._cursor += 2;
                continue;
            }
            else if (["=", "<", ">", "+" , "-" , "*" , "/" , "%"].includes(char)) {
                this._tokens.push({'type': TokenType.OPERATOR, 'value': char});
                ++this._cursor;
                continue;
            }

            // punctuation
            switch (char) {
                case ',': 
                    this._tokens.push({'type': TokenType.COMMA, 'value': char});
                    ++this._cursor;
                    continue;
                case '.': 
                    this._tokens.push({'type': TokenType.DOT, 'value': char});
                    ++this._cursor;
                    continue;
                case ';': 
                    this._tokens.push({'type': TokenType.SEMICOLON, 'value': char});
                    ++this._cursor;
                    continue;
                case '(': 
                    this._tokens.push({'type': TokenType.OPEN_PARAN, 'value': char});
                    ++this._cursor;
                    continue;
                case ')': 
                    this._tokens.push({'type': TokenType.CLOSE_PARAN, 'value': char});
                    ++this._cursor;
                    continue;
            }

            throw SyntaxError(`unknown character '${char}' at char:${this._cursor + 1}`);
        }

       return this._tokens;
    }

    private static is_alpha(char: string) : boolean {
        return (char >= 'A' && char <= 'Z') || (char >= 'a' && char <= 'z'); 
    }
    
    private static is_number(char: string) : boolean { return char >= '0' && char < '9'; }

    private _tokenize_string_literal(quote: string) : void {
        // i'll consume the upcoming characters til' i find the closing quote
        let iterator: number = this._cursor + 1;
        while (this._buffer[iterator + 1] !== quote) {
            ++iterator;
            if (iterator === this._buffer_size) // reaching end of input without closing quote
                throw new SyntaxError(`quote at char:${this._cursor + 1} had never closed`)
        };
        this._tokens.push(
            {
                'type': TokenType.STRING, 
                'value': this._buffer.slice(this._cursor + 1, iterator + 1)
            } /* the +2 cuz iterator will end up at the last character
            of the string so i need to increment it by 1 to the index
            of the quote and as slice end paramter is exclusive so i
            need another increment to include it */
        );
        this._cursor = iterator + 2;
    }

    private _tokenize_number_literal() : void {
        let iterator: number = this._cursor;
        while (
            iterator !== this._buffer_size &&
            Lexer.is_number(this._buffer[iterator + 1])
        ) ++iterator;
        if (this._buffer[iterator + 1] === '.') { // handling floating point
            ++iterator;
            if (!Lexer.is_number(this._buffer[iterator + 1]))
                throw new SyntaxError(`unexpected '${this._buffer[iterator]}' at char:${iterator + 1}`)
            while (
                iterator !== this._buffer_size &&
                Lexer.is_number(this._buffer[iterator + 1])
            ) ++iterator;
        } 
        this._tokens.push(
            {
                'type': TokenType.NUMBER,
                'value': +(this._buffer.slice(this._cursor, iterator + 1))
            }
        );
        this._cursor = iterator + 1;
    }

    private _tokenize_identity_or_keyword_or_type() : void {
        let iterator: number = this._cursor;
        while (
            iterator !== this._buffer_size && (
                Lexer.is_alpha(this._buffer[iterator + 1]) || 
                Lexer.is_number(this._buffer[iterator + 1]) ||
                this._buffer[iterator + 1] == '_'
            )
        ) ++iterator;
        let slice: string = this._buffer.slice(this._cursor, iterator + 1);
        if (KEYWORDS.includes(slice.toUpperCase()))
            this._tokens.push({'type': TokenType.KEYWORD, 'value': slice.toUpperCase()});
        else if (TYPES.includes(slice.toUpperCase()))
            this._tokens.push({'type': TokenType.TYPE, 'value': slice.toUpperCase()});
        else this._tokens.push({'type': TokenType.IDENTIFIER, 'value': slice});
        this._cursor = iterator + 1;
    }
}