import { Executer } from "src/backend/executer";
import { TABLE_PAGE_DATA_FILE } from "src/constants/file_path";
import { AttributeCatalog, data_type, premitive, RelationCatalog } from "src/interfaces/catalog";
import { SelectStatement } from "src/interfaces/dml/select_statement_ast";
import { ExecutionResult } from "src/interfaces/execution_result";

export class SelectExecuter extends Executer {
    public async execute_async(statement: SelectStatement): Promise<ExecutionResult> {
        // get catalogs of relation nad its all attributes
        const relation_catalog: RelationCatalog = await this._analyzer.get_relation_catalog_async(statement.table);
        const all_attrs: AttributeCatalog[] = await this._analyzer.get_table_attributes_catalogs_async(relation_catalog.name);
        // construct catalog list of provided columns
        let attributes_catalogs: AttributeCatalog[] = [];
        for (let i: number = 0; i < statement.columns.length; ++i) {
            // handle wild card
            if (statement.columns[i] === '*') {
                attributes_catalogs.push(...all_attrs);
                continue;
            }
            attributes_catalogs.push(all_attrs.filter(c => c.name === statement.columns[i])[0]);
        }
        // get indexes for columns provided in select statement
        const select_indexes: number[] = attributes_catalogs.map(ac => ac.index);
        // get indexes for columns provided in order by
        let order_indexes: number[] = [];
        if (statement.ordering !== undefined) {
            const attrs_names: string[] = all_attrs.map(attr => attr.name);
            order_indexes = statement.ordering?.map(col => {
                if (!attrs_names.includes(col))
                    throw new Error(`attribute ${col} does not exist in relation ${relation_catalog.name}`);
                return all_attrs.filter(attr => attr.name === col)[0].index
            });
        }
        // compute table schema (column datatypes)
        const schema: data_type[] = all_attrs.map(attr => attr.type);
        // calculate start page, end page
        const boundaries: [number, number] = await this._analyzer.calculate_range_query_pages_async(
            relation_catalog.name, 
            statement.condition
        );
        // construct lambda to check matching rows
        const is_match = await this._analyzer.construct_logical_lambda_async(
            relation_catalog.name, 
            statement.condition
        );
        // get the index of the pivot column (provided identifier in where clause)
        const identifier_index: number = (
            await this._analyzer.get_column_indexes_async(
                relation_catalog.name,
                statement.condition === undefined ?
                [] :
                [statement.condition?.left as string]
            )
        )[0];
        // flag to check limit
        let hit_limit: Boolean = false;
        // construct updated buffer
        let buffer: premitive[][] = [];
        for (let page_number: number = boundaries[0]; page_number <= boundaries[1]; ++page_number) {
            for await (const row of this._file_handler.stream_read_async(
                TABLE_PAGE_DATA_FILE(statement.table, page_number),
                schema
            )) {
                // check if the value of the pivot column matching the one provided in where clause
                if (is_match(row[identifier_index], statement.condition?.right as premitive)) {
                    // if so add select rows and ordering rows to a list and then append to buffer
                    const res: premitive[] = [];
                    for (const index of select_indexes)
                        res.push(row[index]);
                    for (const index of order_indexes)
                        res.push(row[index]);
                    buffer.push(res);
                    // check if limit provided and buffer size exceeded limit
                    // bypass if ordering provided cuz limit gonna be checked after ordering
                    if (
                        statement.limit !== undefined && 
                        buffer.length === statement.limit &&
                        statement.ordering?.length === 0
                    ) {
                        hit_limit = true;
                        break;
                    }
                }
                if (hit_limit) break;
           }
           // if ordering provided order using custom recursive lambda for multi column ordering
            if (order_indexes.length > 0)
                buffer = buffer.sort((e1, e2) => this.order(e1, e2, order_indexes));
        }
        return { 
            type: "ROWS", 
            tag: "SELECT", 
            row_count: buffer.length,
            // exclude ordering columns from result and recheck limit
            rows: buffer.map(el => el.slice(0, select_indexes.length)).slice(0, statement.limit) 
        };
    }

    private order(row1: premitive[], row2: premitive[], indexes: number[], iterator: number = 0): number {
        if (iterator >= indexes.length) return 0;
        const index = indexes[iterator];
        if (row1[index]! < row2[index]!) return -1;
        else if (row1[index]! > row2[index]!) return 1;
        else return this.order(row1, row2, indexes, iterator + 1)
    }
}