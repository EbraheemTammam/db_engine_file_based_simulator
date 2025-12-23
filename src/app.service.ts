import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { IFileHandler } from './interfaces/file_handler';
import { FileHandler } from './backend/file_handler';
import { ATTRIBUTE_SCHEMA_FILE, RELATION_SCHEMA_FILE } from './constants/file_path';

@Injectable()
export class AppService implements OnApplicationBootstrap {
	async onApplicationBootstrap() {
		const handler: IFileHandler = new FileHandler();
		await handler.make_dir("database/schema");
		await handler.make_dir("database/data");
		await handler.append_async(RELATION_SCHEMA_FILE, []);
		await handler.append_async(ATTRIBUTE_SCHEMA_FILE, []);
	}
}
