import { Parser } from "src/frontend/parser";
import { premitive } from "src/interfaces/catalog";
import { LogicalConditionStatement } from "src/interfaces/dml/logical_condition_ast";
import { Token, TokenType } from "src/interfaces/token";

export class LogicalConditionParser extends Parser {
    public parse() : LogicalConditionStatement {
        this.consume(TokenType.KEYWORD, 'WHERE');
        const left: Token = this.consume(TokenType.IDENTIFIER);
        if (left.value !== "id")
            throw new SyntaxError(`unexpected token ${left.value}, filtering using fields other than id is not supported currently`);
        const operator: Token = this.consume(TokenType.OPERATOR);
        if (operator.value !== "=")
            throw new SyntaxError(`unexpected token ${left.value}, only = operator is supported currently`);
        const right: Token = this.consume();
        if (right.type !== TokenType.NUMBER)
            throw new SyntaxError(`unexpected token ${left.value}, expected a number literal`);
        return {
            type: "LogicalCondition",
            left: left.value,
            operator: operator.value,
            right: right.value as premitive
        }
    }
}