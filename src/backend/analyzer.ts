import { IFileHandler } from "src/interfaces/file_handler";
import { FileHandler } from "./file_handler";
import { 
    AttributeCatalog, 
    data_type, 
    premitive, 
    RelationCatalog
} from "src/interfaces/catalog"
import {
    ATTRIBUTE_CATALOG_DATATYPES, 
    RELATION_CATALOG_DATATYPES,
    ATTRIBUTE_SCHEMA_FILE,
    RELATION_SCHEMA_FILE,
    TABLE_PAGE_DATA_FILE
} from "src/constants/file_path";

export class Analyzer {
    private readonly _file_handler: IFileHandler;
    public static readonly PAGE_SIZE: number = 100;

    constructor() {
        this._file_handler = new FileHandler();
    }

    public async check_table_existance_async(table_name: string): Promise<boolean> {
        for await (const row of this._file_handler.stream_read_async(
            RELATION_SCHEMA_FILE, RELATION_CATALOG_DATATYPES
        )) if (row[0] === table_name) return true;
        return false;
    }
    
    public async check_column_existance_async(table_name: string, column_name: string): Promise<boolean> {
        for await (const row of this._file_handler.stream_read_async(
            ATTRIBUTE_SCHEMA_FILE, ATTRIBUTE_CATALOG_DATATYPES
        )) if (row[0] === table_name && row[1] === column_name) return true;
        return false;
    }

    public async get_relation_catalog_async(table_name: string): Promise<RelationCatalog> {
        for await (const row of this._file_handler.stream_read_async(
            RELATION_SCHEMA_FILE, RELATION_CATALOG_DATATYPES
        )) if (row[0] === table_name) return this.deserialize_relation(row);
        throw new Error(`relation ${table_name} does not exist`);
    }

    public async get_attributes_catalogs_async(table_name: string, column_names: string[]): Promise<AttributeCatalog[]> {
        const res: AttributeCatalog[] = [];
        for await (const row of this._file_handler.stream_read_async(
            ATTRIBUTE_SCHEMA_FILE, ATTRIBUTE_CATALOG_DATATYPES
        )) {
            if (row[0] === table_name && column_names.includes(row[1] as string)) 
                res.push(this.deserialize_attribute(row));
            if (res.length === column_names.length) break;
        };
        if (res.length === column_names.length) return res;
        const found_names: string[] = res.map(catalog => catalog.name);
        throw new Error(`attributes ${column_names.filter(name => !found_names.includes(name)).join(', ')} does not exist in relation ${table_name}`);
    }

    public async get_excluded_attributes_async(table_name: string, column_names?: string[]): Promise<AttributeCatalog[]> {
        const res: AttributeCatalog[] = [];
        if (column_names === undefined) return res;
        for await (const row of this._file_handler.stream_read_async(
            ATTRIBUTE_SCHEMA_FILE, ATTRIBUTE_CATALOG_DATATYPES
        )) {
            if (row[0] === table_name && !column_names.includes(row[1] as string)) 
                res.push(this.deserialize_attribute(row));
        };
        return res;
    }

    public async get_table_attributes_catalogs_async(table_name: string): Promise<AttributeCatalog[]> {
        const res: AttributeCatalog[] = [];
        for await (const row of this._file_handler.stream_read_async(
            ATTRIBUTE_SCHEMA_FILE, ATTRIBUTE_CATALOG_DATATYPES
        )) {
            if (row[0] === table_name) 
                res.push(this.deserialize_attribute(row));
        };
        return res;
    }

    public async get_column_indexes_async(table: string, columns: string[] | undefined = undefined): Promise<number[]> {
        if (columns === undefined) {
            let column_count: number = (await this.get_relation_catalog_async(table)).column_count;
            return Array.from({ length: column_count + 1 }, (_, i) => i);
        }
        return (await this.get_attributes_catalogs_async(table, columns)).map(catalog => catalog.index);            
    }

    public async validate_column_datatypes_async(table: string, columns: string[] | undefined = undefined, values: premitive[][]): Promise<void> {
        const catalogs: AttributeCatalog[] = (
            columns === undefined ?
            await this.get_table_attributes_catalogs_async(table) :
            await this.get_attributes_catalogs_async(table, columns)
        );
        for (const row of values) {
            for (let i: number = 0; i < catalogs.length; ++i) {
                switch (true) {
                    case row[i] === "DEFAULT":
                    case !catalogs[i].not_null && row[i] === null:
                    case catalogs[i].type === "BOOL" && typeof(row[i]) === "boolean":
                    case catalogs[i].type === "TEXT" && typeof(row[i]) === "string":
                    case catalogs[i].type === "INT" && typeof(row[i]) === "number":
                    case catalogs[i].type === "SERIAL" && typeof(row[i]) === "number":
                        break;
                    default:
                        throw new Error(`value '${row[i]}' can not be assigned to column of type ${catalogs[i].type}`);
                }
            }
        }
    }

    public async validate_values_length_async(table: string, columns: string[] | undefined = undefined, values: premitive[][]): Promise<void> {
        const length: number = (
            columns === undefined ? 
            (await this.get_relation_catalog_async(table)).column_count : 
            columns.length
        ); 
        for (const row of values) {
            if (row.length < length)
                throw new Error('INSERT has more target columns than expressions');
            else if (row.length > length)
                throw new Error('INSERT has more expressions than target columns');
        }
    }

    public validate_not_null(catalogs: AttributeCatalog[], values: premitive[][]): premitive[][] {
        const res: premitive[][] = [];
        for (const row of values) {
            for (let i: number = 0; i < row.length; ++i) {
                if (row[i] === null && catalogs[i].not_null)
                    throw new Error(`column ${catalogs[i].name} can not be null`);
                else if (row[i] === "DEFAULT") {
                    if (catalogs[i].default === null)
                        throw new Error(`column ${catalogs[i].name} has no default value specified`);
                    row[i] = catalogs[i].default;
                }
            }
            res.push(row);
        }
        return res;
    }

    public async validate_unique_constraints(relation: string, indexes: number[], values: premitive[][]): Promise<void> {
        const catalog: RelationCatalog = await this.get_relation_catalog_async(relation);
        for (let i: number = 1; i <= catalog.page_count; ++i) {
            for await (const line of this._file_handler.stream_read_async(TABLE_PAGE_DATA_FILE(relation, i))) {
                for (const row of values) {
                    for (const index of indexes) {
                        if (row[index] === line[index])
                            throw new Error(`value ${row[index]} violates unique constraints`);
                    }
                }
            }
        }
    }

    public async update_relation_schema_async(catalog: RelationCatalog): Promise<void> {
        let buffer: premitive[][] = [];
        for await (const row of this._file_handler.stream_read_async(
            RELATION_SCHEMA_FILE, RELATION_CATALOG_DATATYPES
        )) {
            if (row[0] !== catalog.name) {
                buffer.push(row);
                continue;
            }
            buffer.push(this.serialize_relation(catalog));
        }
        this._file_handler.write_async(RELATION_SCHEMA_FILE, buffer);
    }

    public get_page_number(object_id: number) {
        return Math.ceil(object_id / Analyzer.PAGE_SIZE)
    }

    public serialize_relation(relation: RelationCatalog): premitive[] {
        return [
            relation.name, 
            relation.column_count, 
            relation.row_count, 
            relation.page_count,
            relation.last_index
        ];
    }

    public serialize_attribute(attribute: AttributeCatalog): premitive[] {
        return [
            attribute.relation,
            attribute.name,
            attribute.index,
            attribute.type,
            attribute.not_null,
            attribute.unique,
            attribute.default,
            attribute.pk,
            attribute.fk,
            attribute.reference || ""
        ];
    }

    public deserialize_relation(data: premitive[]): RelationCatalog {
        return { 
            name: data[0] as string, 
            column_count: data[1] as number, 
            row_count: data[2] as number, 
            page_count: data[3] as number,
            last_index: data[4] as number 
        };
    }

    public deserialize_attribute(data: premitive[]): AttributeCatalog {
        return {
            relation: data[0] as string,
            name: data[1] as string,
            index: data[2] as number,
            type: data[3] as data_type,
            not_null: data[4] as boolean,
            unique: data[5] as boolean,
            default: data[6] === '' ? null : data[6] as premitive,
            pk: data[7] as boolean,
            fk: data[8] as boolean,
            reference: data.length > 8 ? data[9] as string : undefined
        }
    }
}