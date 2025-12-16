import { Injectable } from '@nestjs/common';
import { DDLExecutionFactory } from 'src/backend/executers/ddl_executer_factory';
import { Lexer } from 'src/frontend/lexer';
import { DDLParserFactory } from 'src/frontend/parsers/ddl_parser_factory';
import { DMLParserFactory } from 'src/frontend/parsers/dml_parser_factory';
import { ASTNode } from 'src/interfaces/ast';
import { IExecuter } from 'src/interfaces/executer';
import { ExecutionResult } from 'src/interfaces/execution_result';
import { Token, TokenType } from 'src/interfaces/token';
import { token_array_split } from 'src/utils/token_array_split';

@Injectable()
export class CoreService {
    public async execute_async(buffer: string, type: "DDL" | "DML" = "DDL") {
        let lexemes: Array<Token> = this.lex(buffer);
        let ASTs: ASTNode[] = type === "DDL" ? this.parse_ddl(lexemes) : this.parse_dml(lexemes);
        return await this.execute_ddl_async(ASTs);
    }

    private async execute_ddl_async(nodes: ASTNode[]) : Promise<ExecutionResult[]> {
        let results: ExecutionResult[] = [];
        for (const n of nodes) {
            const executer: IExecuter = new DDLExecutionFactory(n).build();
            results.push(await executer.execute_async(n) as ExecutionResult);
        }
        return results;
    }

    private lex(buffer: string) : Token[] {
        let lexer: Lexer = new Lexer(buffer);
        return lexer.tokenize();
    }

    private parse_ddl(lexemes: Token[]) : ASTNode[] {
        let splitted_lexemes: Array<Array<Token>> = token_array_split(lexemes, { type: TokenType.SEMICOLON });
        if (splitted_lexemes[splitted_lexemes.length - 1][0].type === TokenType.EOF)
            splitted_lexemes = splitted_lexemes.slice(0, splitted_lexemes.length - 1)
        let ASTs: Array<ASTNode> = new Array<ASTNode>();
        splitted_lexemes.forEach(
            element => ASTs.push((new DDLParserFactory(element)).build().parse()
        ));
        return ASTs;
    }

    private parse_dml(lexemes: Token[]) : ASTNode[] {
        let splitted_lexemes: Array<Array<Token>> = token_array_split(lexemes, { type: TokenType.SEMICOLON });
        if (splitted_lexemes[splitted_lexemes.length - 1][0].type === TokenType.EOF)
            splitted_lexemes = splitted_lexemes.slice(0, splitted_lexemes.length - 1)
        let ASTs: Array<ASTNode> = new Array<ASTNode>();
        splitted_lexemes.forEach(
            element => ASTs.push((new DMLParserFactory(element)).build().parse()
        ));
        return ASTs;
    }
}
