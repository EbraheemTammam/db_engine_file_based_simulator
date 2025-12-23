import { Executer } from "src/backend/executer";
import { ATTRIBUTE_SCHEMA_FILE, RELATION_SCHEMA_FILE, TABLE_PAGE_DATA_FILE } from "src/constants/file_path";
import { CreateTableStatement } from "src/interfaces/ddl/create_statement_ast";
import { ExecutionResult } from "src/interfaces/execution_result";

export class CreateExecuter extends Executer {
    public override async execute_async(statement: CreateTableStatement): Promise<ExecutionResult> {
        // check if table exists
        if (await this._analyzer.check_table_existance_async(statement.name)) {
            if (statement.skip_if_exists) return { type: "COMMAND", tag: "CREATE TABLE" }
            throw new Error(`table ${statement.name} already exists`);
        }
        // append relation info to relations file
        await this._file_handler.append_async(RELATION_SCHEMA_FILE, [[statement.name, statement.columns.length, 0, 1, 0]]);
        // append attributes info to attributes file
        let index: number = 0;
        await this._file_handler.append_async(
            ATTRIBUTE_SCHEMA_FILE,
            statement.columns.map(c => [
                statement.name, 
                c.name,
                index++,
                c.data_type,
                c.constraints?.not_null || false,
                c.constraints?.unique || false,
                c.constraints?.default || null,
                c.constraints?.pk || false,
                c.constraints?.reference !== undefined,
                c.constraints?.reference || ''
            ])
        );
        // create first page file
        await this._file_handler.write_async(TABLE_PAGE_DATA_FILE(statement.name, 1), []);
        return { type: "COMMAND", tag: "CREATE TABLE" }
    }
}