import { Executer } from "src/backend/executer";
import { 
    RELATION_CATALOG_DATATYPES, 
    RELATION_SCHEMA_FILE, 
    TABLE_DIR, 
    TABLE_PAGE_DATA_FILE 
} from "src/constants/file_path";
import { premitive, RelationCatalog } from "src/interfaces/catalog";
import { TruncateTableStatement } from "src/interfaces/ddl/truncate_statement_ast";
import { ExecutionResult } from "src/interfaces/execution_result";

export class TruncateExecuter extends Executer {
    public override async execute_async(statement: TruncateTableStatement) : Promise<ExecutionResult> {
        // check if one or more tables does not exist
        for (const name of statement.tables) {
            if (!await this._analyzer.check_table_existance_async(name))
                throw new Error(`table ${name} does not exist`);
        }
        // delete all data dirs of provided tables
        await this._file_handler.delete_dirs_async(statement.tables.map(name => TABLE_DIR(name)));
        for (const table of statement.tables)
            await this._file_handler.write_async(TABLE_PAGE_DATA_FILE(table, 1), []);
        // reset row count
        const buffer: premitive[][] = [];
        for await (const row of this._file_handler.stream_read_async(RELATION_SCHEMA_FILE, RELATION_CATALOG_DATATYPES)) {
            const relation: RelationCatalog = this._analyzer.deserialize_relation(row);
            if (statement.tables.includes(relation.name)) {
                relation.row_count = 0;
                buffer.push(this._analyzer.serialize_relation(relation));
                continue;
            }
            buffer.push(row);
        }
        this._file_handler.write_async(RELATION_SCHEMA_FILE, buffer);
        return { type: "COMMAND", tag: "TRUNCATE TABLE" }
    }
}