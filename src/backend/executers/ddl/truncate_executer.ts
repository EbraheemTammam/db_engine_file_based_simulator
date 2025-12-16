import { NotImplementedException } from "@nestjs/common";
import { Executer } from "src/backend/executer";
import { TruncateTableStatement } from "src/interfaces/ddl/truncate_statement_ast";
import { ExecutionResult } from "src/interfaces/execution_result";

export class TruncateExecuter extends Executer {
    public override execute_async(statement: TruncateTableStatement) : Promise<ExecutionResult> {
        throw new NotImplementedException();
    }
}