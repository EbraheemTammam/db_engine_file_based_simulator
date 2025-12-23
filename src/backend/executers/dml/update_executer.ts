import { Executer } from "src/backend/executer";
import { TABLE_PAGE_DATA_FILE } from "src/constants/file_path";
import { AttributeCatalog, data_type, premitive, RelationCatalog } from "src/interfaces/catalog";
import { UpdateStatement } from "src/interfaces/dml/update_statement_ast";
import { ExecutionResult } from "src/interfaces/execution_result";

export class UpdateExecuter extends Executer {
    public async execute_async(statement: UpdateStatement): Promise<ExecutionResult> {
        // validate column duplicates
        if ((new Set<string>(statement.columns)).size < statement.columns.length)
            throw new Error('multiple assignments to the same column');
        // validate expressions match columns datatypes
        await this._analyzer.validate_column_datatypes_async(statement.table, statement.columns, [statement.values]);
        // validating nullability of columns
        const attrs_catalogs: AttributeCatalog[] = await this._analyzer.get_attributes_catalogs_async(
            statement.table, statement.columns
        );
        const values: premitive[] = this._analyzer.validate_not_null(attrs_catalogs, [statement.values])[0];
        // get the schema of the relation to parse while reading data
        const catalog: RelationCatalog = await this._analyzer.get_relation_catalog_async(statement.table);
        const schema: data_type[] = (
            await this._analyzer.get_table_attributes_catalogs_async(catalog.name)
        ).map(attr => attr.type);
        // calculate start page, end page
        const boundaries: [number, number] = await this._analyzer.calculate_range_query_pages_async(catalog.name, statement.condition);
        // construct lambda to check matching rows
        const is_match = await this._analyzer.construct_logical_lambda_async(catalog.name, statement.condition);
        // get the index of the pivot column (provided identifier in where clause)
        const identifier_index: number = (
            await this._analyzer.get_column_indexes_async(
                catalog.name,
                statement.condition === undefined ?
                [] :
                [statement.condition?.left as string]
            )
        )[0];
        // get indexes of provided columns
        const indexes: number[] = await this._analyzer.get_column_indexes_async(statement.table, statement.columns);
        // store affected row count
        let count: number = 0;
        // loop over calculated pages
        for (let page_number: number = boundaries[0]; page_number <= boundaries[1]; ++page_number) {
            // construct updated buffer
            const buffer: premitive[][] = [];
            for await (const row of this._file_handler.stream_read_async(
                TABLE_PAGE_DATA_FILE(statement.table, page_number),
                schema
            )) {
                // check if the value of the pivot column matching the one provided in where clause
                if (is_match(row[identifier_index], statement.condition?.right as premitive)) {
                    // if so update the row with the provided values
                    for (let i: number = 0; i < values.length; ++i)
                        row[indexes[i]] = values[i];
                    buffer.push(row);
                    ++count;
                    continue;
                }
                // else take the row as it is
                buffer.push(row);
            }
            // write the constructed buffer to the current page
            await this._file_handler.write_async(TABLE_PAGE_DATA_FILE(statement.table, page_number), buffer);
        }
        return { type: "COMMAND", tag: "UPDATE", row_count: count };
    }
}