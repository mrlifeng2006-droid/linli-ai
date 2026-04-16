export function query<T = any>(sql: string, params?: any[]): T[];
export function queryOne<T = any>(sql: string, params?: any[]): T | undefined;
export function execute(sql: string, params?: any[]): any;
export function execBatch(sql: string): void;
export function initTables(): void;
export function testConnection(): boolean;
export function close(): void;
export default {};
