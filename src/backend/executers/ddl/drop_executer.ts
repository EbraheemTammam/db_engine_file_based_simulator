import { Executer } from "src/backend/executer";
import { premitive } from "src/interfaces/catalog";
import { DropStatement } from "src/interfaces/ddl/drop_statement_ast";
import { ExecutionResult } from "src/interfaces/execution_result";

export class DropExecuter extends Executer {
    public override async execute_async(statement: DropStatement) : Promise<ExecutionResult> {
        for (const name of statement.objects) {
            if (!await this._analyzer.check_table_existance(name)) {
                throw new Error(`table ${name} does not exist`);
            }
        }
        let buffer: premitive[][] = [];
        for await (const row of this._file_handler.stream_read_async('database/schema/relations.csv', ['TEXT'])) {
            if (statement.objects.includes(row[0])) continue;
            buffer.push(row as premitive[]);
        }
        await this._file_handler.write_async('database/schema/relations.csv', buffer);
        buffer = []
        for await (const row of this._file_handler.stream_read_async('database/schema/attributes.csv', ['TEXT'])) {
            if (statement.objects.includes(row[0])) continue;
            buffer.push(row as premitive[]);
        }
        await this._file_handler.write_async('database/schema/attributes.csv', buffer);
        await this._file_handler.delete_dirs_async(statement.objects.map(o => `database/data/${o}`));
        return { type: "COMMAND", tag: "DROP TABLE" }
    }
}