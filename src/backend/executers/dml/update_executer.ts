import { Executer } from "src/backend/executer";
import { ASTNode } from "src/interfaces/ast";
import { ExecutionResult } from "src/interfaces/execution_result";

export class UpdateExecuter extends Executer {
    public execute_async(node: ASTNode): Promise<ExecutionResult> | AsyncGenerator<ExecutionResult> {
        throw new Error("Method not implemented.");
    }
}