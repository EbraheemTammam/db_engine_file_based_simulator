import { ASTNode } from "src/interfaces/ast";
import { IExecuter } from "src/interfaces/executer";
import { DropExecuter } from "./ddl/drop_executer";
import { TruncateExecuter } from "./ddl/truncate_executer";
import { CreateExecuter } from "./ddl/create_executer";
import { AlterExecuter } from "./ddl/alter_executer";
import { AlterNameExecuter } from "./ddl/alter_name_executer";

export class DDLExecutionFactory {
    private readonly _node: ASTNode;

    constructor(node: ASTNode) {
        this._node = node;
    }

    public build() : IExecuter {
        switch (this._node.type) {
            case 'CreateDatabase':
            case 'CreateTable':
            case 'CreateIndex':
                return new CreateExecuter(this._node.type.slice(6));
            case 'DropDatabase':
            case 'DropTable':
            case 'DropIndex':
                return new DropExecuter(this._node.type.slice(6));
            case 'TruncateTable':
                return new TruncateExecuter();
            case 'AlterColumnAdd':
            case 'AlterColumnDrop':
            case 'AlterColumnName':
            case 'AlterColumnDataType':
            case 'AlterColumnDefaultValue':
            case 'AlterColumnNotNull':
                return new AlterExecuter(this._node.type.slice(11));
            case 'AlterDatabaseName':
            case 'AlterTableName':
            case 'AlterIndexName':
                return new AlterNameExecuter();
            default:
                throw new SyntaxError(`unsupported node type ${this._node.type}`);
        }
    }
}