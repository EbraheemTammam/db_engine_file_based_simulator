import { Executer } from "src/backend/executer";
import { TABLE_PAGE_DATA_FILE } from "src/constants/file_path";
import { premitive, RelationCatalog } from "src/interfaces/catalog";
import { DeleteStatement } from "src/interfaces/dml/delete_statement_ast";
import { ExecutionResult } from "src/interfaces/execution_result";

export class DeleteExecuter extends Executer {
    public async execute_async(statement: DeleteStatement): Promise<ExecutionResult> {
        let row_count: number = 1;
        switch (statement.condition) {
            case undefined:
                row_count = await this.delete_all_async(statement);
                break;
            default:
                await this.delete_one_async(statement);
        }
        return { type: "COMMAND", tag: "DELETE", row_count: row_count }
    }

    private async delete_one_async(statement: DeleteStatement): Promise<void> {
        const id: number = statement.condition?.right as number;
        const page_number: number = this._analyzer.get_page_number(id);
        const page_count: number = (await this._analyzer.get_relation_catalog_async(statement.table_name)).page_count;
        if (page_number > page_count)
            throw new Error(`object with id ${id} does not exist`);
        const buffer: premitive[][] = [];
        let found = false;
        for await (const row of this._file_handler.stream_read_async(TABLE_PAGE_DATA_FILE(statement.table_name, page_number))) {
            if (Number(row[0]) === id) {
                found = true;
                continue;
            }
            buffer.push(row);
        }
        if (!found) 
            throw new Error(`object with id ${id} does not exist`); 
        await this._file_handler.write_async(TABLE_PAGE_DATA_FILE(statement.table_name, page_number), buffer);
        await this._analyzer.increment_row_count_async(statement.table_name, -1);
    }

    private async delete_all_async(statement: DeleteStatement):  Promise<number> {
        if (!await this._analyzer.check_table_existance_async(statement.table_name))
            throw new Error(`table ${statement.table_name} does not exist`);
        await this._file_handler.delete_dirs_async([statement.table_name]);
        await this._file_handler.write_async(TABLE_PAGE_DATA_FILE(statement.table_name, 1), []);
        const catalog: RelationCatalog = await this._analyzer.get_relation_catalog_async(statement.table_name);
        this._analyzer.increment_row_count_async(statement.table_name, -1 * catalog.row_count)
        return catalog.row_count;
    }
}