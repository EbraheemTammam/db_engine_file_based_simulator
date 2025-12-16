import { NotImplementedException } from "@nestjs/common";
import { Executer } from "src/backend/executer";
import { RenameStatement } from "src/interfaces/ddl/alter_statement_ast";
import { ExecutionResult } from "src/interfaces/execution_result";

export class AlterNameExecuter extends Executer {
    public override execute(statement: RenameStatement) : Promise<ExecutionResult> {
        throw new NotImplementedException();
    }
}