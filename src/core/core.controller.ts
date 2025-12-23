import { Body, Controller, Get, Post, Query, ValidationPipe} from '@nestjs/common';
import { CoreService } from './core.service';
import { isInstance } from 'class-validator';
import { ExecutionResult } from 'src/interfaces/execution_result';
import { Token, TokenType } from 'src/interfaces/token';
import { token_array_split } from 'src/utils/token_array_split';
import { ASTNode } from 'src/interfaces/ast';
import { IFileHandler } from 'src/interfaces/file_handler';
import { FileHandler } from 'src/backend/file_handler';
import { DAY_LOGS_FILE } from 'src/constants/file_path';

@Controller()
export class CoreController {
    private readonly _service: CoreService;

    constructor(service: CoreService) {
        this._service = service;
    }

    @Post('execute/ddl')
    async execute_ddl(@Body() buffer: string) {
        try {
            const lexemes: Token[][] = token_array_split(
                this._service.lex(buffer).filter(token => token.type !== TokenType.COMMENT),
                { type: TokenType.SEMICOLON }
            );
            const ASTs: ASTNode[] = this._service.parse_ddl(lexemes);
            const results: ExecutionResult[] = await this._service.execute_ddl_async(ASTs);
            await this._service.log_queries(lexemes);
            return results;
        }
        catch (e) {
            const now: Date = new Date();
            let error_with_location: string = e.stack.split('\n')[1].trim();
            error_with_location = (
                error_with_location.slice(0, error_with_location.indexOf('(')) +
                error_with_location.slice(error_with_location.indexOf(')') + 1, error_with_location.indexOf(')')) 
            );
            const syntax_error: boolean = isInstance(e, SyntaxError);
            console.error(`\x1b[31m[${now.toLocaleDateString()} ${now.toLocaleTimeString()}] [ERROR] ${syntax_error ? 'SyntaxError: ' : ''}${e.message} ${error_with_location}\x1b[0m`);
            return {'error': e.message}
        }
    }

    @Post('execute/dml')
    async execute_dml(@Body() buffer: string) {
        try {
            const lexemes: Token[][] = token_array_split(
                this._service.lex(buffer).filter(token => token.type !== TokenType.COMMENT),
                { type: TokenType.SEMICOLON }
            );
            const ASTs: ASTNode[] = this._service.parse_dml(lexemes);
            const results: ExecutionResult[] = await this._service.execute_dml_async(ASTs);
            await this._service.log_queries(lexemes);
            return results;
        }
        catch (e) {
            const now: Date = new Date();
            let error_with_location: string = e.stack.split('\n')[1].trim();
            error_with_location = (
                error_with_location.slice(0, error_with_location.indexOf('(')) +
                error_with_location.slice(error_with_location.indexOf(')') + 1, error_with_location.indexOf(')')) 
            );
            const syntax_error: boolean = isInstance(e, SyntaxError);
            console.error(`\x1b[31m[${now.toLocaleDateString()} ${now.toLocaleTimeString()}] [ERROR] ${syntax_error ? 'SyntaxError: ' : ''}${e.message} ${error_with_location}\x1b[0m`);
            return {'error': e.message}
        }
    }

    @Get('history')
    async get_history(@Query("date", ValidationPipe) date?: string) {
        const handler: IFileHandler = new FileHandler();
        if (date === undefined)
            date = (new Date()).toLocaleDateString();
        try {
            const buffer: { time: string, query: string }[] = [];
            for await (const line of handler.stream_read_async(DAY_LOGS_FILE(date.replaceAll('/', '-'))))
            buffer.push({ time: line[0] as string, query: line[1] as string });
            return buffer;
        }
        catch {
            return [];
        }
    }
}
