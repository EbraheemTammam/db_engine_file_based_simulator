import { Injectable } from '@nestjs/common';
import { DDLExecutionFactory } from 'src/backend/executers/ddl_executer_factory';
import { DMLExecutionFactory } from 'src/backend/executers/dml_executer_factory';
import { FileHandler } from 'src/backend/file_handler';
import { DAY_LOGS_FILE } from 'src/constants/file_path';
import { Lexer } from 'src/frontend/lexer';
import { DDLParserFactory } from 'src/frontend/parsers/ddl_parser_factory';
import { DMLParserFactory } from 'src/frontend/parsers/dml_parser_factory';
import { ASTNode } from 'src/interfaces/ast';
import { IExecuter } from 'src/interfaces/executer';
import { ExecutionResult } from 'src/interfaces/execution_result';
import { IFileHandler } from 'src/interfaces/file_handler';
import { Token, TokenType } from 'src/interfaces/token';

@Injectable()
export class CoreService {
    public async execute_ddl_async(nodes: ASTNode[]) : Promise<ExecutionResult[]> {
        let results: ExecutionResult[] = [];
        for (const n of nodes) {
            const executer: IExecuter = new DDLExecutionFactory(n).build();
            results.push(await executer.execute_async(n) as ExecutionResult);
        }
        return results;
    }

    public async execute_dml_async(nodes: ASTNode[]) : Promise<ExecutionResult[]> {
        let results: ExecutionResult[] = [];
        for (const n of nodes) {
            const executer: IExecuter = new DMLExecutionFactory(n).build();
            results.push(await executer.execute_async(n) as ExecutionResult);
        }
        return results;
    }

    public lex(buffer: string) : Token[] {
        let lexer: Lexer = new Lexer(buffer);
        return lexer.tokenize();
    }

    public parse_ddl(lexemes: Token[][]) : ASTNode[] {
        if (lexemes[lexemes.length - 1][0].type === TokenType.EOF)
            lexemes = lexemes.slice(0, lexemes.length - 1)
        let ASTs: Array<ASTNode> = new Array<ASTNode>();
        lexemes.forEach(
            element => ASTs.push((new DDLParserFactory(element)).build().parse()
        ));
        return ASTs;
    }

    public parse_dml(lexemes: Token[][]) : ASTNode[] {
        if (lexemes[lexemes.length - 1][0].type === TokenType.EOF)
            lexemes = lexemes.slice(0, lexemes.length - 1)
        let ASTs: Array<ASTNode> = new Array<ASTNode>();
        lexemes.forEach(
            element => ASTs.push((new DMLParserFactory(element)).build().parse()
        ));
        return ASTs;
    }

    public async log_queries(lexemes: Token[][]) : Promise<void> {
        const handler: IFileHandler = new FileHandler();
        const now: Date = new Date();
        const queries: string[] = lexemes.filter(
            lexem => lexem[0].type !== TokenType.EOF
        ).map(tokens => {
            return tokens.map(token => {
                switch (token.type) {
                    case TokenType.STRING:
                        return `'${token.value}'`;
                    case TokenType.IDENTIFIER:
                    case TokenType.BOOLEAN:
                    case TokenType.NUMBER:
                    case TokenType.KEYWORD:
                    case TokenType.TYPE:
                    case TokenType.OPERATOR:
                        return token.value?.toString();
                    case TokenType.OPEN_PARAN:
                        return '(';
                    case TokenType.CLOSE_PARAN:
                        return ')';
                    case TokenType.COMMA:
                        return ',';
                    case TokenType.DOT:
                        return '.';
                    case TokenType.NULL:
                        return "NULL";
                    case TokenType.SEMICOLON:
                        return ';';
                    case TokenType.COMMENT:
                    case TokenType.EOF:
                    default: 
                        return '';
                };
            }).join(' ');
        });
        await handler.append_async(DAY_LOGS_FILE(now.toLocaleDateString().replaceAll('/', '-')), queries.map(query => {
            console.log(`\x1b[32m[${now.toLocaleDateString()} ${now.toLocaleTimeString()}] [INFO ] ${query}\x1b[0m`);
            return [`${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, query];
        }));
    }
}
