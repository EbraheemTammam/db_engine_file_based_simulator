import { ASTNode } from "./ast";
import { ExecutionResult } from "./execution_result";

export interface IExecuter {
    execute_async(node: ASTNode) : Promise<ExecutionResult> | AsyncGenerator<ExecutionResult>;
}