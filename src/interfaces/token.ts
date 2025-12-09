export enum TokenType {
    KEYWORD,
    IDENTIFIER,
    NUMBER,
    STRING,
    BOOLEAN,
    NULL,
    OPERATOR,
    COMMA,
    DOT,
    SEMICOLON,
    OPEN_PARAN,
    CLOSE_PARAN,
    COMMENT,
    EOF
}

export interface Token {
    type: TokenType,
    value?: string | number | boolean
}