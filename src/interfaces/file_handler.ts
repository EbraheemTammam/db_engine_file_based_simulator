import { data_type, premitive } from "./catalog";

export interface IFileHandler {
    stream_read_async(path: string, schema?: data_type[]): AsyncGenerator<premitive[]>;
    write_async(path: string, data: premitive[][]): Promise<boolean>;
    append_async(path: string, data: premitive[][]): Promise<boolean>;
    delete_dirs_async(paths: string[]): Promise<void>;
    rename_dir(old_name, new_name): Promise<void>;
}