import { IFileHandler } from "src/interfaces/file_handler";
import { FileHandler } from "./file_handler";

export class Analyzer {
    private readonly _file_handler: IFileHandler;

    constructor() {
        this._file_handler = new FileHandler();
    }

    public async check_table_existance(table_name: string): Promise<boolean> {
        for await (const row of this._file_handler.stream_read_async('database/schema/relations.csv', ['INT', 'TEXT', 'INT'])) {
            if (row[1] === table_name) return true;
        }
        return false;
    }
}