import { ASTNode } from "../ast";

export interface TruncateTableStatement extends ASTNode {
    type: "TruncateTableStatement",
    name: string
}