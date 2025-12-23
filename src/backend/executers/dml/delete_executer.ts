import { Executer } from "src/backend/executer";
import { TABLE_PAGE_DATA_FILE } from "src/constants/file_path";
import { data_type, premitive, RelationCatalog } from "src/interfaces/catalog";
import { DeleteStatement } from "src/interfaces/dml/delete_statement_ast";
import { ExecutionResult } from "src/interfaces/execution_result";

export class DeleteExecuter extends Executer {
    public async execute_async(statement: DeleteStatement): Promise<ExecutionResult> {
        // get relation schema to parse data while reading 
        const catalog: RelationCatalog = await this._analyzer.get_relation_catalog_async(statement.table_name);
        const schema: data_type[] = (
            await this._analyzer.get_table_attributes_catalogs_async(statement.table_name)
        ).map(attr => attr.type);
        // calculate start/end pages and construct matching function
        const boundaries: [number, number] = await this._analyzer.calculate_range_query_pages_async(catalog.name, statement.condition);
        const is_match = await this._analyzer.construct_logical_lambda_async(catalog.name, statement.condition);
        // get pivot column index (provided in where clause)
        const identifier_index: number = (
            await this._analyzer.get_column_indexes_async(
                catalog.name,
                [statement.condition?.left as string]
            )
        )[0];
        // store affected rows count
        let count: number = 0;
        // iterate over pages
        for (let page_number: number = boundaries[0]; page_number <= boundaries[1]; ++page_number) {
            // delete buffer construction
            const buffer: premitive[][] = [];
            for await (const row of this._file_handler.stream_read_async(
                TABLE_PAGE_DATA_FILE(statement.table_name, page_number),
                schema
            )) {
                // check if row matches
                if (is_match(row[identifier_index], statement.condition?.right as premitive)) {
                    // if so skip row
                    ++count;
                    --catalog.row_count;
                    continue;
                }
                // else append to buffer
                buffer.push(row);
            }
            // write updated buffer to current page
            await this._file_handler.write_async(TABLE_PAGE_DATA_FILE(statement.table_name, page_number), buffer);
        }
        // update relation schema (row count)
        await this._analyzer.update_relation_schema_async(catalog);
        return { type: "COMMAND", tag: "DELETE", row_count: count };
    }
}