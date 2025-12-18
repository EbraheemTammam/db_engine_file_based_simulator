import { IFileHandler } from "src/interfaces/file_handler";
import { FileHandler } from "./file_handler";

export class Analyzer {
    private readonly _file_handler: IFileHandler;

    constructor() {
        this._file_handler = new FileHandler();
    }

    public async check_table_existance(table_name: string): Promise<boolean> {
        for await (const row of this._file_handler.stream_read_async(
            'database/schema/relations.csv', 
            ['TEXT', 'INT']
        )) if (row[0] === table_name) return true;
        return false;
    }
    
    public async check_column_existance(table_name: string, column_name: string) {
        for await (const row of this._file_handler.stream_read_async(
            'database/schema/attributes.csv', 
            ['TEXT', 'TEXT', 'TEXT', 'BOOL', 'BOOL', 'TEXT', 'BOOL', 'BOOL', 'TEXT']
        )) if (row[0] === table_name && row[1] === column_name) return true;
        return false;
    }
}