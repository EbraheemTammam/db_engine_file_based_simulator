import { ASTNode } from "src/interfaces/ast";
import { IExecuter } from "src/interfaces/executer";
import { ExecutionResult } from "src/interfaces/execution_result";
import { IFileHandler } from "src/interfaces/file_handler";
import { FileHandler } from "./file_handler";

export abstract class Executer implements IExecuter {
    protected readonly _object?: string;
    protected readonly _file_handler: IFileHandler;

    constructor(object?: string) {
        this._object = object?.toLowerCase();
        this._file_handler = new FileHandler();
    }

    public abstract execute(node: ASTNode): ExecutionResult;
}