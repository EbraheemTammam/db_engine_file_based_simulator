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

export const KEYWORDS: string[] = [
    "SELECT", "FROM", "WHERE", "AND", "OR", "NOT",
    "INSERT", "INTO", "VALUES", "UPDATE", "SET",
    "DELETE", "CREATE", "ALTER", "DROP", "TABLE",
    "INDEX", "VIEW", "JOIN", "INNER", "LEFT",
    "RIGHT", "FULL", "ON", "GROUP", "BY", "ORDER",
    "ASC", "DESC", "LIMIT", "OFFSET", "HAVING",
    "DISTINCT", "AS", "UNION", "ALL", "IN", "IS",
    "NULL", "LIKE", "BETWEEN","CASE", "WHEN",
    "THEN", "ELSE", "END", "PRIMARY", "KEY",
    "FOREIGN", "REFERENCES", "DEFAULT", "CHECK",
    "UNIQUE", "EXISTS", "COUNT", "CAST"
]

export interface Token {
    type: TokenType,
    value: string | number | boolean
}