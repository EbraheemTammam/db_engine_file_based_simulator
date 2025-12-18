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
        if (await this._analyzer.check_column_existance_async(statement.name, statement.column_name))
            throw new Error(`column ${statement.name} already exists`);
        switch (this._action) {
            case 'Add':
                this.add_column(statement);
                break;
            case 'Drop':
                this.drop_column(statement);
                break;
            case 'Name':
                this.rename_column(statement);
                break;
            case 'DataType':
                this.alter_column_datatype(statement);
                break;
            case 'DefaultValue':
                this.alter_column_default_value(statement);
                break;
            case 'NotNull':
                this.alter_column_not_null(statement);
                break;
        }
        return { type: "COMMAND", tag: "ALTER TABLE" };
    }

    private async add_column(statement: AlterColumnStatement): Promise<void> {
        const catalog: RelationCatalog = await this._analyzer.get_relation_catalog_async(statement.name);
        if (catalog.row_count > 0 && statement.constraints?.not_null && (statement.constraints.default === undefined))
            throw new Error('column must be nullable or have a default value');
        await this._file_handler.append_async(
            ATTRIBUTE_SCHEMA_FILE,
            [
                [
                    statement.name, 
                    statement.column_name,
                    statement.data_type!,
                    catalog.column_count,
                    statement.constraints?.not_null || false,
                    statement.constraints?.unique || false,
                    statement.constraints?.default || null,
                    statement.constraints?.pk || false,
                    statement.constraints?.reference !== undefined,
                    statement.constraints?.reference || ''
                ]
            ]
        );
        await this._analyzer.increment_column_count_async(statement.name);
        let buffer: premitive[][];
        for (let page_number: number = 1; page_number <= catalog.page_count; ++page_number) {
            buffer = [];
            for await (const row of this._file_handler.stream_read_async(TABLE_PAGE_DATA_FILE(statement.name, page_number)))
                buffer.push([...row, statement.constraints?.default || null])
            await this._file_handler.write_async(TABLE_PAGE_DATA_FILE(statement.name, page_number), buffer);
        }
    }

    private async drop_column(statement: AlterColumnStatement): Promise<void> {
        let buffer: premitive[][] = [];
        for await (const row of this._file_handler.stream_read_async(ATTRIBUTE_SCHEMA_FILE, ATTRIBUTE_CATALOG_DATATYPES)) {
            if (row[0] === statement.name && row[1] === statement.column_name) continue;
            buffer.push(row);
        }
        await this._file_handler.write_async(ATTRIBUTE_SCHEMA_FILE, buffer);
        await this._analyzer.increment_column_count_async(statement.name, -1);
        const page_count: number = (await this._analyzer.get_relation_catalog_async(statement.name)).page_count;
        const column_index: number = (await this._analyzer.get_attribute_catalog_async(statement.name, statement.column_name)).index;
        for (let page_number: number = 1; page_number <= page_count; ++page_number) {
            buffer = [];
            for await (const row of this._file_handler.stream_read_async(TABLE_PAGE_DATA_FILE(statement.name, page_number)))
                buffer.push([...row.slice(0, column_index), ...row.slice(column_index + 1)]);
            await this._file_handler.write_async(TABLE_PAGE_DATA_FILE(statement.name, page_number), buffer);
        }
    }

    private async rename_column(statement: AlterColumnStatement): Promise<void> {
        if (await this._analyzer.check_column_existance_async(statement.name, statement.new_name!))
            throw new Error(`column ${statement.name} already exists`);
        let buffer: premitive[][] = [];
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

    private async alter_column_datatype(statement: AlterColumnStatement): Promise<void> {
        // should validate ability to convert first
        throw new NotImplementedException();
    }

    private async alter_column_default_value(statement: AlterColumnStatement): Promise<void> {
        let buffer: premitive[][] = [];
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

    private async alter_column_not_null(statement: AlterColumnStatement): Promise<void> {
        // should check if data containing nulls first
        throw new NotImplementedException();
    }
}