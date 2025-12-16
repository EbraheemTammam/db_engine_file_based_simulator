import { Body, Controller, Post} from '@nestjs/common';
import { CoreService } from './core.service';

@Controller('execute')
export class CoreController {
    private readonly _service: CoreService;

    constructor(service: CoreService) {
        this._service = service;
    }

    @Post('ddl')
    async execute_ddl(@Body() buffer: string) {
        try {
            return await this._service.execute_async(buffer);
        }
        catch (e) {
            let now: Date = new Date();
            let error_with_location: string = e.stack.split('\n')[1].trim();
            error_with_location = (
                error_with_location.slice(0, error_with_location.indexOf('(')) +
                error_with_location.slice(error_with_location.indexOf(')') + 1, error_with_location.indexOf(')')) 
            );
            console.error(`\x1b[31m[${now.toLocaleDateString()} ${now.toLocaleTimeString()}] [ERROR] SyntaxError: ${e.message}`);
            console.error(`\t\t\t\t${error_with_location}\x1b[0m`);
            return {'error': e.message}
        }
    }

    @Post('dml')
    async execute_dml(@Body() buffer: string) {
        try {
            return await this._service.execute_async(buffer, "DML");
        }
        catch (e) {
            let now: Date = new Date();
            let error_with_location: string = e.stack.split('\n')[1].trim();
            error_with_location = (
                error_with_location.slice(0, error_with_location.indexOf('(')) +
                error_with_location.slice(error_with_location.indexOf(')') + 1, error_with_location.indexOf(')')) 
            );
            console.error(`\x1b[31m[${now.toLocaleDateString()} ${now.toLocaleTimeString()}] [ERROR] SyntaxError: ${e.message}`);
            console.error(`\t\t\t\t${error_with_location}\x1b[0m`);
            return {'error': e.message}
        }
    }
}
