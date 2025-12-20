import { ASTNode } from "../ast";
import { premitive } from "../catalog";
import { LogicalConditionStatement } from "./logical_condition_ast";

export interface UpdateStatement extends ASTNode {
    type: "Update",
    table: string,
    columns: string[],
    values: (premitive | "DEFAULT")[],
    condition?: LogicalConditionStatement
}