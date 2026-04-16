declare module '@koa/cors' {
  import { Middleware } from 'koa';
  function cors(options?: any): Middleware;
  export = cors;
}

declare module 'better-sqlite3' {
  export interface Database {
    prepare(sql: string): Statement;
    exec(sql: string): void;
    pragma(pragma: string): any;
    close(): void;
  }
  export interface Statement {
    all(...params: any[]): any[];
    get(...params: any[]): any;
    run(...params: any[]): RunResult;
  }
  export interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }
  export default Database;
}
