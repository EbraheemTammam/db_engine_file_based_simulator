import * as fs from "fs";
import * as readline from "readline";
import { finished } from "stream/promises";
import { mkdir, rm, cp, rename } from "fs/promises";
import { IFileHandler } from "src/interfaces/file_handler";
import { data_type, premitive } from "src/interfaces/catalog";

export class FileHandler implements IFileHandler {
    public async* stream_read_async(path: string, schema: data_type[]): AsyncGenerator<premitive[]> {
        if (!await this.is_file_exists_async(path))
            throw new Error(`file ${path} does not exist`);
        const file: fs.ReadStream = fs.createReadStream(path);
        const read_line: readline.Interface = readline.createInterface({ input: file });
        for await (const line of read_line)
            yield this.format(line, schema);
    }

    public async write_async(path: string, data: premitive[][] = []): Promise<boolean> {
        try {
            await mkdir(path.slice(0, path.lastIndexOf('/')), { recursive: true });
            const tmp = path + ".tmp";
            const stream = fs.createWriteStream(tmp);
            for (const row of data)
                stream.write(row.join(',') + "\n");
            stream.end();
            await finished(stream);
            fs.renameSync(tmp, path);
            return true;
        }
        catch {
            return false;
        }
    }

    public async append_async(path: string, data: premitive[][]): Promise<boolean> {
        try {
            await mkdir(path.slice(0, path.lastIndexOf('/')), { recursive: true });
            const stream = fs.createWriteStream(path, { flags: "a" });
            for (const row of data)
                stream.write(row.join(',') + "\n");
            stream.end();
            await finished(stream);
            return true;
        }
        catch {
            return false;
        }
    }

    public async delete_dirs_async(paths: string[]): Promise<void> {
        for (const path of paths)
            await rm(path, { recursive: true, force: true });
    }

    public async rename_dir(old_name, new_name): Promise<void> {
        try {
            await rename(old_name, new_name);
        } 
        catch (e) {
            if (e.code === "EXDEV") {
                await cp(old_name, new_name, { recursive: true });
                await rm(old_name, { recursive: true, force: true });
            } 
            else throw e;
        }
    }
    
    private async is_file_exists_async(path: string): Promise<boolean> {
        try {
            await fs.promises.access(path, fs.constants.F_OK);
            return true;
        } 
        catch {
            return false;
        }
    }

    private format(line: string, schema: data_type[]) {
        let values: string[] = line.split(',');
        let res: premitive[] = [];
        for (let i = 0; i < values.length; ++i) {
            if (i >= schema.length) {
                res.push(values[i]);
                continue;
            }
            switch (schema[i]) {
                case 'INT':
                case 'SERIAL':
                    res.push(Number(values[i]));
                    break;
                case 'BOOL':
                    res.push(values[i] === "true");
                    break;
                case 'TEXT':
                default:
                    res.push(values[i]);
            }
        }
        return res;
    }
}