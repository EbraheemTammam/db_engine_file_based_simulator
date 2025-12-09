import { Token } from "./token";

export class Lexer {
    private _tokens: Token[];
    private _buffer: string;

    constructor(buffer: string) {
        this._buffer = buffer;
        this._tokens = new Array<Token>();
    }

    tokenize() : Token[] {
        let iterator: number = 0;
        /*
            I'm tryna handle each type of
            token types i've set in token.ts
            file here and i got a bunch of them
            (
                i think this is going out of 
                control somehow and i should've
                stucked to bruteforcing string
                buffers but i'm gonna try anyway
            )
        */
       return new Array<Token>(); // i'll let it like this til' i think how i'm gonna handle it
    }
}