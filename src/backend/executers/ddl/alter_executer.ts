import { NotImplementedException } from "@nestjs/common";
import { Executer } from "src/backend/executer";
import { ATTRIBUTE_CATALOG_DATATYPES, ATTRIBUTE_SCHEMA_FILE, TABLE_PAGE_DATA_FILE } from "src/constants/file_path";
import { premitive, RelationCatalog, AttributeCatalog } from "src/interfaces/catalog";
import { AlterColumnStatement } from "src/interfaces/ddl/alter_statement_ast";
import { ExecutionResult } from "src/interfaces/execution_result";

export class AlterExecuter extends Executer {
    private readonly _action: string;
    
    constructor(action: string) {
        super();
        this._action = action;
    }

    public override async execute_async(statement: AlterColumnStatement): Promise<ExecutionResult> {
        if (!await this._analyzer.check_table_existance_async(statement.name))
            throw new Error(`table ${statement.name} does not exist`);
        switch (this._action) {
            case 'Add':
                await this.add_column_async(statement);
                break;
            case 'Drop':
                await this.drop_column_async(statement);
                break;
            case 'Name':
                await this.rename_column_async(statement);
                break;
            case 'DataType':
                await this.alter_column_datatype_async(statement);
                break;
            case 'DefaultValue':
                await this.alter_column_default_value_async(statement);
                break;
            case 'NotNull':
                await this.alter_column_not_null_async(statement);
                break;
        }
        return { type: "COMMAND", tag: "ALTER TABLE" };
    }

    private async add_column_async(statement: AlterColumnStatement): Promise<void> {
        // check column existance
        if (await this._analyzer.check_column_existance_async(statement.name, statement.column_name))
            throw new Error(`column ${statement.column_name} already exists at relation ${statement.name}`);
        // check if there're rows existing amd the provided column is not nullable and has no default value
        const catalog: RelationCatalog = await this._analyzer.get_relation_catalog_async(statement.name);
        if (catalog.row_count > 0 && statement.constraints?.not_null && (statement.constraints.default === undefined))
            throw new Error('column must be nullable or have a default value');
        // otherwise append it to attributes file
        await this._file_handler.append_async(
            ATTRIBUTE_SCHEMA_FILE,
            [
                [
                    statement.name, 
                    statement.column_name,
                    catalog.column_count,
                    statement.data_type!,
                    statement.constraints?.not_null || false,
                    statement.constraints?.unique || false,
                    statement.constraints?.default || null,
                    statement.constraints?.pk || false,
                    statement.constraints?.reference !== undefined,
                    statement.constraints?.reference || ''
                ]
            ]
        );
        // increment relation column count
        ++catalog.column_count;
        await this._analyzer.update_relation_schema_async(catalog);
        // rewrite pages with new column default value or null
        for (let page_number: number = 1; page_number <= catalog.page_count; ++page_number) {
            const buffer: premitive[][] = [];
            for await (const row of this._file_handler.stream_read_async(TABLE_PAGE_DATA_FILE(statement.name, page_number)))
                buffer.push([...row, statement.constraints?.default || null])
            await this._file_handler.write_async(TABLE_PAGE_DATA_FILE(statement.name, page_number), buffer);
        }
    }

    private async drop_column_async(statement: AlterColumnStatement): Promise<void> {
        // check column existance
        if (!await this._analyzer.check_column_existance_async(statement.name, statement.column_name))
            throw new Error(`column ${statement.column_name} does not exist at relation ${statement.name}`);
        // rewriting pages with provided column removed
        const catalog: RelationCatalog = await this._analyzer.get_relation_catalog_async(statement.name);
        const column_index: number = (
            await this._analyzer.get_attributes_catalogs_async(statement.name, [statement.column_name])
        )[0].index;
        for (let page_number: number = 1; page_number <= catalog.page_count; ++page_number) {
            const buffer: premitive[][] = [];
            for await (const row of this._file_handler.stream_read_async(TABLE_PAGE_DATA_FILE(statement.name, page_number)))
                buffer.push([...row.slice(0, column_index), ...row.slice(column_index + 1)]);
            await this._file_handler.write_async(TABLE_PAGE_DATA_FILE(statement.name, page_number), buffer);
        }
        // remove column from attributes data
        const buffer: premitive[][] = [];
        for await (const row of this._file_handler.stream_read_async(ATTRIBUTE_SCHEMA_FILE, ATTRIBUTE_CATALOG_DATATYPES)) {
            if (row[0] === statement.name && row[1] === statement.column_name) continue;
            buffer.push(row);
        }
        await this._file_handler.write_async(ATTRIBUTE_SCHEMA_FILE, buffer);
        // decrement column count in relation schema
        --catalog.column_count;
        await this._analyzer.update_relation_schema_async(catalog);
    }

    private async rename_column_async(statement: AlterColumnStatement): Promise<void> {
        // check if column does not exist
        if (!await this._analyzer.check_column_existance_async(statement.name, statement.column_name))
            throw new Error(`column ${statement.column_name} does not exists at relation ${statement.name}`);
        // check if new column already exists
        if (await this._analyzer.check_column_existance_async(statement.name, statement.new_name!))
            throw new Error(`column ${statement.new_name} already exists at relation ${statement.name}`);
        // otherwise rename in attributes file
        const buffer: premitive[][] = [];
        for await (const row of this._file_handler.stream_read_async(ATTRIBUTE_SCHEMA_FILE, ATTRIBUTE_CATALOG_DATATYPES)) {
            if (row[0] === statement.name && row[1] === statement.column_name) {
                row[1] = statement.new_name!;
                buffer.push(row);
                continue;
            }
            buffer.push(row);
        }
        await this._file_handler.write_async(ATTRIBUTE_SCHEMA_FILE, buffer);
    }

    private async alter_column_datatype_async(statement: AlterColumnStatement): Promise<void> {
        // should validate ability to convert first
        throw new NotImplementedException();
    }

    private async alter_column_default_value_async(statement: AlterColumnStatement): Promise<void> {
        // check if column does not exist
        if (!await this._analyzer.check_column_existance_async(statement.name, statement.column_name))
            throw new Error(`column ${statement.column_name} does not exist at relation ${statement.name}`);
        // validate expression matching column datatype
        await this._analyzer.validate_column_datatypes_async(statement.name, [statement.column_name], [[statement.constraints?.default!]]);
        // otherwise change the default value in attributes file
        const buffer: premitive[][] = [];
        for await (const row of this._file_handler.stream_read_async(ATTRIBUTE_SCHEMA_FILE, ATTRIBUTE_CATALOG_DATATYPES)) {
            if (row[0] === statement.name && row[1] === statement.column_name) {
                const attribute: AttributeCatalog = this._analyzer.deserialize_attribute(row);
                attribute.default = statement.constraints?.default!;
                buffer.push(this._analyzer.serialize_attribute(attribute));
                continue;
            }
            buffer.push(row);
        }
        await this._file_handler.write_async(ATTRIBUTE_SCHEMA_FILE, buffer);
    }

    private async alter_column_not_null_async(statement: AlterColumnStatement): Promise<void> {
        // should check if data containing nulls first
        throw new NotImplementedException();
    }
}