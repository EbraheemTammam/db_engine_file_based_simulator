import { ASTNode } from "../ast";

export interface LogicalConditionStatement extends ASTNode {
    type: "LogicalCondition"
    operator: string,
    left: LogicalConditionStatement | string | number | boolean | null,
    right: LogicalConditionStatement | string | number | boolean | null
}

/* 
    parsing using recusrion and a stack with perioritizing operators and 
    pushing till unmatched periority then pop and construct a tree
*/