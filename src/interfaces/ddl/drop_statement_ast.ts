import { ASTNode } from "../ast";

export interface DropStatement extends ASTNode {
    type: "DropDatabaseStatement" | "DropTableStatement" | "DropIndexStatement",
    name: string
}

export interface DropDatabaseStatement extends DropStatement {
    type: "DropDatabaseStatement"
}

export interface DropTableStatement extends DropStatement {
    type: "DropTableStatement"
}

export interface DropIndexStatement extends DropStatement {
    type: "DropIndexStatement"
}