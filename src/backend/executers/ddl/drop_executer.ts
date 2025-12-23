import { Executer } from "src/backend/executer";
import { AttributeCatalog, premitive, RelationCatalog } from "src/interfaces/catalog";
import { DropStatement } from "src/interfaces/ddl/drop_statement_ast";
import { ExecutionResult } from "src/interfaces/execution_result";
import {
    ATTRIBUTE_SCHEMA_FILE, 
    ATTRIBUTE_CATALOG_DATATYPES, 
    RELATION_CATALOG_DATATYPES, 
    RELATION_SCHEMA_FILE,
    TABLE_DIR
} from "src/constants/file_path"

export class DropExecuter extends Executer {
    public override async execute_async(statement: DropStatement) : Promise<ExecutionResult> {
        // check if one or more tables does not exist
        for (const name of statement.objects) {
            if (!await this._analyzer.check_table_existance_async(name)) { 
                throw new Error(`table ${name} does not exist`);
            }
        }
        // otherwise construct updated buffer and write it
        let buffer: premitive[][] = [];
        for await (const row of this._file_handler.stream_read_async(RELATION_SCHEMA_FILE, RELATION_CATALOG_DATATYPES)) {
            const relation: RelationCatalog = this._analyzer.deserialize_relation(row);
            if (statement.objects.includes(relation.name)) continue;
            buffer.push(row as premitive[]);
        }
        await this._file_handler.write_async(RELATION_SCHEMA_FILE, buffer);
        // drop all attributes of the provided tables
        buffer = []
        for await (const row of this._file_handler.stream_read_async(ATTRIBUTE_SCHEMA_FILE, ATTRIBUTE_CATALOG_DATATYPES)) {
            const attribute: AttributeCatalog = this._analyzer.deserialize_attribute(row);
            if (statement.objects.includes(attribute.relation)) continue;
            buffer.push(row);
        }
        await this._file_handler.write_async(ATTRIBUTE_SCHEMA_FILE, buffer);
        await this._file_handler.delete_dirs_async(statement.objects.map(name => TABLE_DIR(name)));
        return { type: "COMMAND", tag: "DROP TABLE" }
    }
}