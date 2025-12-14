import { ASTNode } from "../ast";
import { LogicalConditionStatement } from "./logical_condition_ast";

export interface ColumnUpdate {
    column_name: string,
    value: string | boolean | number | null | "DEFAULT"
}

export interface UpdateStatement extends ASTNode {
    type: "UpdateStatement",
    table: string,
    updates: ColumnUpdate[],
    condition?: LogicalConditionStatement
}