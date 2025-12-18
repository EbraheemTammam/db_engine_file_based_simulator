import { ASTNode } from "src/interfaces/ast";
import { IExecuter } from "src/interfaces/executer";
import { SelectExecuter } from "./dml/select_executer";
import { InsertExecuter } from "./dml/insert_executer";
import { UpdateExecuter } from "./dml/update_executer";
import { DeleteExecuter } from "./dml/delete_executer";

export class DMLExecutionFactory {
    private readonly _node: ASTNode;

    constructor(node: ASTNode) {
        this._node = node;
    }

    public build() : IExecuter {
        switch (this._node.type) {
            case 'Select':
                return new SelectExecuter();
            case 'Insert':
                return new InsertExecuter();
            case 'Update':
                return new UpdateExecuter();
            case 'Delete':
                return new DeleteExecuter();
            default:
                throw new SyntaxError(`unsupported node type ${this._node.type}`);
        }
    }
}