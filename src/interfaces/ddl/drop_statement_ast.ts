import { ASTNode } from "../ast";

export interface DropStatement extends ASTNode {
    type: "DropDatabaseStatement" | "DropTableStatement" | "DropIndexStatement",
    objects: string[]
}