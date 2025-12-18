import { Executer } from "src/backend/executer";
import { 
    AttributeCatalog, 
    premitive, 
    RelationCatalog,
    ATTRIBUTE_SCHEMA_FILE, 
    ATTRIBUTE_CATALOG_DATATYPES, 
    RELATION_CATALOG_DATATYPES, 
    RELATION_SCHEMA_FILE
} from "src/interfaces/catalog";
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
        for await (const row of this._file_handler.stream_read_async(RELATION_SCHEMA_FILE, RELATION_CATALOG_DATATYPES)) {
            const relation: RelationCatalog = this._analyzer.deserialize_relation(row);
            if (statement.objects.includes(relation.name)) continue;
            buffer.push(row as premitive[]);
        }
        await this._file_handler.write_async('database/schema/relations.csv', buffer);
        buffer = []
        for await (const row of this._file_handler.stream_read_async(ATTRIBUTE_SCHEMA_FILE, ATTRIBUTE_CATALOG_DATATYPES)) {
            const attribute: AttributeCatalog = this._analyzer.deserialize_attribute(row);
            if (statement.objects.includes(attribute.relation)) continue;
            buffer.push(row);
        }
        await this._file_handler.write_async('database/schema/attributes.csv', buffer);
        await this._file_handler.delete_dirs_async(statement.objects.map(o => `database/data/${o}`));
        return { type: "COMMAND", tag: "DROP TABLE" }
    }
}