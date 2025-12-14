import { ASTNode } from "../ast";

export interface LogicalConditionStatement extends ASTNode { // i'm gonna need recursion to parse this shit
    type: "LogicalCondition"
    operator: string,
    left: LogicalConditionStatement | string | number | boolean | null,
    right: LogicalConditionStatement | string | number | boolean | null
}