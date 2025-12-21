import { Executer } from "src/backend/executer";
import { TABLE_PAGE_DATA_FILE } from "src/constants/file_path";
import { premitive, RelationCatalog } from "src/interfaces/catalog";
import { UpdateStatement } from "src/interfaces/dml/update_statement_ast";
import { ExecutionResult } from "src/interfaces/execution_result";

export class UpdateExecuter extends Executer {
    public async execute_async(statement: UpdateStatement): Promise<ExecutionResult> {
        let row_count: number = 1;
        switch (statement.condition) {
            case undefined:
                row_count = await this.update_all_async(statement);
                break;
            default:
                await this.update_one_async(statement);
        }
        return { type: "COMMAND", tag: "UPDATE", row_count: row_count }
    }

    private async update_one_async(statement: UpdateStatement): Promise<void> {
        const id: number = statement.condition?.right as number;
        const page_number: number = this._analyzer.get_page_number(id);
        const page_count: number = (await this._analyzer.get_relation_catalog_async(statement.table)).page_count;
        if (page_number > page_count)
            throw new Error(`object with id ${id} does not exist`);
        const buffer: premitive[][] = [];
        const indexes: number[] = await this.get_column_indexes_async(statement);
        let found = false;
        for await (const row of this._file_handler.stream_read_async(TABLE_PAGE_DATA_FILE(statement.table, page_number))) {
            if (Number(row[0]) === id) {
                found = true;
                for (let i: number = 0; i < statement.values.length; ++i)
                    row[indexes[i]] = statement.values[i];
                buffer.push(row);
                continue;
            }
            buffer.push(row);
        }
        if (!found) 
            throw new Error(`object with id ${id} does not exist`); 
        await this._file_handler.write_async(TABLE_PAGE_DATA_FILE(statement.table, page_number), buffer);
    }

    private async update_all_async(statement: UpdateStatement):  Promise<number> {
        const catalog: RelationCatalog = await this._analyzer.get_relation_catalog_async(statement.table);
        const indexes: number[] = await this.get_column_indexes_async(statement);
        for (let page_number: number = 1; page_number <= catalog.page_count; ++page_number) {
            const buffer: premitive[][] = [];
            for await (const row of this._file_handler.stream_read_async(TABLE_PAGE_DATA_FILE(statement.table, page_number))) {
                for (let i: number = 0; i < statement.values.length; ++i)
                    row[indexes[i]] = statement.values[i];
                buffer.push(row);
            } 
            await this._file_handler.write_async(TABLE_PAGE_DATA_FILE(statement.table, page_number), buffer);
        }
        return catalog.row_count;
    }

    private async get_column_indexes_async(statement: UpdateStatement): Promise<number[]> {
        if ((new Set<string>(statement.columns)).size < statement.columns.length)
            throw new Error('multiple assignments to the same column');
        return (await this._analyzer.get_attributes_catalogs_async(statement.table, statement.columns)).map(catalog => catalog.index);
    }
}