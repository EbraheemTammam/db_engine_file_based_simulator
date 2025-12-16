import { NotImplementedException } from "@nestjs/common";
import { Executer } from "src/backend/executer";
import { ExecutionResult } from "src/interfaces/execution_result";

export class AlterExecuter extends Executer {
    private readonly _action: string;
    
    constructor(action: string) {
        super();
        this._action = action;
    }

    public execute() : ExecutionResult {
        throw new NotImplementedException();
    }
}