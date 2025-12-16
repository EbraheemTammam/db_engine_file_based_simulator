import { NotImplementedException } from "@nestjs/common";
import { Executer } from "src/backend/executer";
import { DropStatement } from "src/interfaces/ddl/drop_statement_ast";
import { ExecutionResult } from "src/interfaces/execution_result";

export class DropExecuter extends Executer {
    public override execute(statement: DropStatement) : Promise<ExecutionResult> {
        throw new NotImplementedException();
    }
}