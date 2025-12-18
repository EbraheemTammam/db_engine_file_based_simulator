import { Executer } from "src/backend/executer";
import { TruncateTableStatement } from "src/interfaces/ddl/truncate_statement_ast";
import { ExecutionResult } from "src/interfaces/execution_result";

export class TruncateExecuter extends Executer {
    public override async execute_async(statement: TruncateTableStatement) : Promise<ExecutionResult> {
        for (const name of statement.tables) {
            if (!await this._analyzer.check_table_existance(name))
                throw new Error(`table ${name} does not exist`);
        }
        await this._file_handler.delete_dirs_async(statement.tables.map(o => `database/data/${o}`));
        for (const table of statement.tables)
            await this._file_handler.write_async(`database/data/${table}/page_1.csv`, [[]]);
        return { type: "COMMAND", tag: "TRUNCATE TABLE" }
    }
}