import { data_type, premitive } from "./table";

export interface IFileHandler {
    stream_read_async(path: string, schema: data_type[]): AsyncGenerator<premitive[] | false>;
    write_async(path: string, data: premitive[][]): Promise<boolean>;
    append_async(path: string, data: premitive[][]): Promise<boolean>;
}