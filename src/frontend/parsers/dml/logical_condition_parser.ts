import { OPERATORS } from "src/constants/operators";
import { Parser } from "src/frontend/parser";
import { premitive } from "src/interfaces/catalog";
import { LogicalConditionStatement } from "src/interfaces/dml/logical_condition_ast";
import { Token, TokenType } from "src/interfaces/token";

export class LogicalConditionParser extends Parser {
    public parse() : LogicalConditionStatement {
        this.consume(TokenType.KEYWORD, 'WHERE');
        const left: Token = this.consume(TokenType.IDENTIFIER);
        this.validate_token_datatype(left);
        const operator: Token = this.consume(TokenType.OPERATOR);
        if (!OPERATORS.COMPARISON.includes(operator.value as string))
            throw new SyntaxError(`unexpected token ${left.value}, only comparison operators are supported currently`);
        const right: Token = this.consume();
        if (![TokenType.STRING, TokenType.NUMBER, TokenType.BOOLEAN, TokenType.NULL].includes(right.type))
            throw new SyntaxError(`unexpected token ${right.value}, expected a literal`);
        return {
            type: "LogicalCondition",
            left: left.value as string,
            operator: operator.value as string,
            right: right.value as premitive
        }
    }
}