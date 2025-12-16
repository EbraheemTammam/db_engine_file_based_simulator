import { ASTNode } from "src/interfaces/ast";
import { IExecuter } from "src/interfaces/executer";
import { ExecutionResult } from "src/interfaces/execution_result";
import { IFileHandler } from "src/interfaces/file_handler";
import { FileHandler } from "./file_handler";
import { Analyzer } from "./analyzer";

export abstract class Executer implements IExecuter {
    protected readonly _object?: string;
    protected readonly _file_handler: IFileHandler;
    protected readonly _analyzer: Analyzer;
    protected static readonly PAGE_SIZE: number = 200;

    constructor(object?: string) {
        this._object = object?.toLowerCase();
        this._file_handler = new FileHandler();
        this._analyzer = new Analyzer();
    }

    public abstract execute_async(node: ASTNode): Promise<ExecutionResult> | AsyncGenerator<ExecutionResult>;
}