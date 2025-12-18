import { Parser } from "src/frontend/parser";
import { premitive } from "src/interfaces/catalog";
import { LogicalConditionStatement } from "src/interfaces/dml/logical_condition_ast";
import { Token, TokenType } from "src/interfaces/token";

export class LogicalConditionParser extends Parser {
    public parse() : LogicalConditionStatement {
        this.consume(TokenType.KEYWORD, 'WHERE');
        const left: Token = this.consume(TokenType.IDENTIFIER);
        if (typeof(left.value) !== "string")
            throw new SyntaxError(`unexpected token ${left.value}, expected identifier`);
        const operator: Token = this.consume(TokenType.OPERATOR);
        if (typeof(operator.value) !== "string")
            throw new SyntaxError(`unexpected token ${left.value}, expected identifier`);
        const right: Token = this.consume();
        if (![TokenType.STRING, TokenType.NUMBER, TokenType.NULL, TokenType.BOOLEAN].includes(right.type))
            throw new SyntaxError(`unexpected token ${left.value}, expected a literal`);
        return {
            type: "LogicalCondition",
            left: left.value,
            operator: operator.value,
            right: right.value as premitive
        }
    }
}