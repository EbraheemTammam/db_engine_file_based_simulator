import { Executer } from "src/backend/executer";
import { CreateTableStatement } from "src/interfaces/ddl/create_statement_ast";
import { ExecutionResult } from "src/interfaces/execution_result";

export class CreateExecuter extends Executer {
    public override async execute_async(statement: CreateTableStatement): Promise<ExecutionResult> {
        if (await this._analyzer.check_table_existance(statement.name)) {
            if (statement.skip_if_exists) return { type: "COMMAND", tag: "CREATE TABLE" }
            throw new Error(`table ${statement.name} already exists`);
        }
        await this._file_handler.append_async('database/schema/relations.csv', [[statement.name]]);
        await this._file_handler.append_async(
            'database/schema/attributes.csv',
            statement.columns.map(c => [
                statement.name, 
                c.name,
                c.data_type,
                c.constraints?.not_null || false,
                c.constraints?.unique || false,
                c.constraints?.default || null,
                c.constraints?.pk || false,
                c.constraints?.reference !== undefined,
                c.constraints?.reference || ''
            ])
        );
        await this._file_handler.write_async(`database/data/${statement.name}.csv`, [statement.columns.map(c => c.name)]);
        return { type: "COMMAND", tag: "CREATE TABLE" }
    }
}