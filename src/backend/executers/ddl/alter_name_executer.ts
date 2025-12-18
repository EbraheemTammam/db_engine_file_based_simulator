import { Executer } from "src/backend/executer";
import { 
    ATTRIBUTE_CATALOG_DATATYPES, 
    ATTRIBUTE_SCHEMA_FILE, 
    RELATION_CATALOG_DATATYPES, 
    RELATION_SCHEMA_FILE, 
    TABLE_DIR 
} from "src/constants/file_path";
import { AttributeCatalog, premitive, RelationCatalog } from "src/interfaces/catalog";
import { RenameStatement } from "src/interfaces/ddl/alter_statement_ast";
import { ExecutionResult } from "src/interfaces/execution_result";

export class AlterNameExecuter extends Executer {
    public override async execute_async(statement: RenameStatement) : Promise<ExecutionResult> {
        if (await this._analyzer.check_table_existance_async(statement.new_name))
            throw new Error(`table ${statement.new_name} already exists`);
        let buffer: premitive[][] = [];
        for await (const row of this._file_handler.stream_read_async(RELATION_SCHEMA_FILE, RELATION_CATALOG_DATATYPES)) {
            const relation: RelationCatalog = this._analyzer.deserialize_relation(row);
            if (relation.name !== statement.name) {
                buffer.push(row);
                continue;
            }
            relation.name = statement.new_name;
            buffer.push(this._analyzer.serialize_relation(relation));
        }
        await this._file_handler.write_async(RELATION_SCHEMA_FILE, buffer);
        buffer = []
        for await (const row of this._file_handler.stream_read_async(ATTRIBUTE_SCHEMA_FILE, ATTRIBUTE_CATALOG_DATATYPES)) {
            const attribute: AttributeCatalog = this._analyzer.deserialize_attribute(row);
            if (attribute.relation !== statement.name) {
                buffer.push(row);
                continue;
            }
            attribute.relation = statement.new_name;
            buffer.push(this._analyzer.serialize_attribute(attribute));
        }
        await this._file_handler.write_async(ATTRIBUTE_SCHEMA_FILE, buffer);
        this._file_handler.rename_dir(TABLE_DIR(statement.name), TABLE_DIR(statement.new_name));
        return { type: "COMMAND", tag: "ALTER TABLE" }
    }
}