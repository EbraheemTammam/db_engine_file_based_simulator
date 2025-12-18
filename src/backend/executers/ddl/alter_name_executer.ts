import { Executer } from "src/backend/executer";
import { ATTRIBUTE_CATALOG_DATATYPES, ATTRIBUTE_SCHEMA_FILE, AttributeCatalog, premitive, RELATION_CATALOG_DATATYPES, RELATION_SCHEMA_FILE, RelationCatalog } from "src/interfaces/catalog";
import { RenameStatement } from "src/interfaces/ddl/alter_statement_ast";
import { ExecutionResult } from "src/interfaces/execution_result";

export class AlterNameExecuter extends Executer {
    public override async execute_async(statement: RenameStatement) : Promise<ExecutionResult> {
        if (await this._analyzer.check_table_existance(statement.new_name))
            throw new Error(`table ${statement.new_name} already exists`);
        let buffer: premitive[][] = [];
        for await (const row of this._file_handler.stream_read_async(RELATION_SCHEMA_FILE, RELATION_CATALOG_DATATYPES)) {
            const relation: RelationCatalog = this._analyzer.deserialize_relation(row);
            if (relation.name !== statement.name) {
                buffer.push(row);
                continue;
            }
            buffer.push([statement.new_name, relation.row_count]);
        }
        await this._file_handler.write_async('database/schema/relations.csv', buffer);
        buffer = []
        for await (const row of this._file_handler.stream_read_async(ATTRIBUTE_SCHEMA_FILE, ATTRIBUTE_CATALOG_DATATYPES)) {
            const attribute: AttributeCatalog = this._analyzer.deserialize_attribute(row);
            if (attribute.name !== statement.name) {
                buffer.push(row);
                continue;
            }
            buffer.push([statement.new_name, ...row.slice(1)]);
        }
        await this._file_handler.write_async('database/schema/attributes.csv', buffer);
        this._file_handler.rename_dir(`database/data/${statement.name}`, `database/data/${statement.new_name}`);
        return { type: "COMMAND", tag: "ALTER TABLE" }
    }
}