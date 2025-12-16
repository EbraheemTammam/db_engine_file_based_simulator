import { NotImplementedException } from "@nestjs/common";
import { Executer } from "src/backend/executer";
import { AlterColumnStatement } from "src/interfaces/ddl/alter_statement_ast";
import { ExecutionResult } from "src/interfaces/execution_result";

export class AlterExecuter extends Executer {
    private readonly _action: string;
    
    constructor(action: string) {
        super();
        this._action = action;
    }

    public override execute(statement: AlterColumnStatement) : Promise<ExecutionResult> {
        throw new NotImplementedException();
    }
}