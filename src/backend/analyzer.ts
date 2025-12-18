import { IFileHandler } from "src/interfaces/file_handler";
import { FileHandler } from "./file_handler";
import { 
    AttributeCatalog, 
    AttributeCatalogDataTypes, 
    data_type, 
    premitive, 
    RelationCatalog, 
    RelationCatalogDataTypes 
} from "src/interfaces/catalog";

export class Analyzer {
    private readonly _file_handler: IFileHandler;

    constructor() {
        this._file_handler = new FileHandler();
    }

    public async check_table_existance(table_name: string): Promise<boolean> {
        for await (const row of this._file_handler.stream_read_async(
            'database/schema/relations.csv', RelationCatalogDataTypes
        )) if (row[0] === table_name) return true;
        return false;
    }
    
    public async check_column_existance(table_name: string, column_name: string) {
        for await (const row of this._file_handler.stream_read_async(
            'database/schema/attributes.csv', AttributeCatalogDataTypes
        )) if (row[0] === table_name && row[1] === column_name) return true;
        return false;
    }

    public deserialize_relation(data: premitive[]) : RelationCatalog {
        return { name: data[0] as string, row_count: data[1] as number };
    }

    public deserialize_attribute(data: premitive[]) : AttributeCatalog {
        return {
            relation: data[0] as string,
            name: data[1] as string,
            index: data[2] as number,
            type: data[3] as data_type,
            not_null: data[4] as boolean,
            unique: data[5] as boolean,
            default: data[6] as premitive,
            pk: data[7] as boolean,
            fk: data[8] as boolean,
            reference: data.length > 8 ? data[9] as string : undefined
        }
    }
}