import { Executer } from "src/backend/executer";
import { premitive } from "src/interfaces/catalog";
import { RenameStatement } from "src/interfaces/ddl/alter_statement_ast";
import { ExecutionResult } from "src/interfaces/execution_result";

export class AlterNameExecuter extends Executer {
    public override async execute_async(statement: RenameStatement) : Promise<ExecutionResult> {
        if (await this._analyzer.check_table_existance(statement.new_name))
            throw new Error(`table ${statement.new_name} already exists`);
        let buffer: premitive[][] = [];
        for await (const row of this._file_handler.stream_read_async('database/schema/relations.csv', ['TEXT'])) {
            if (row[0] !== statement.name) {
                buffer.push(row as premitive[]);
                continue;
            }
            buffer.push([statement.new_name]);
        }
        await this._file_handler.write_async('database/schema/relations.csv', buffer);
        buffer = []
        for await (const row of this._file_handler.stream_read_async('database/schema/attributes.csv', ['TEXT'])) {
            if (row[0] !== statement.name) {
                buffer.push(row as premitive[]);
                continue;
            }
            let _row: premitive[] = row as premitive[];
            buffer.push([statement.new_name, ..._row.slice(1)]);
        }
        await this._file_handler.write_async('database/schema/attributes.csv', buffer);
        this._file_handler.rename_dir(`database/data/${statement.name}`, `database/data/${statement.new_name}`);
        return { type: "COMMAND", tag: "ALTER TABLE" }
    }
}