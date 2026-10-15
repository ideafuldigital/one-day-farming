// Test-only in-memory D1 adapter. Never imported by application code.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
const sql = new DatabaseSync(':memory:');
for (const file of readdirSync('drizzle').filter(f => f.endsWith('.sql')).sort())
    sql.exec(readFileSync('drizzle/' + file, 'utf8'));
class Statement {
    constructor(private query: string, private values: (string | number | null)[] = []) { }
    bind(...values: (string | number | null)[]) { return new Statement(this.query, values); }
    async first<T>() { return (sql.prepare(this.query).get(...this.values) as T | undefined) ?? null; }
    async all<T>() { return { results: sql.prepare(this.query).all(...this.values) as T[] }; }
    async run() { const r = sql.prepare(this.query).run(...this.values); return { meta: { changes: Number(r.changes) }, success: true }; }
}
const objects = new Map<string, Uint8Array>();
export const env = { BUCKET: { async put(key: string, bytes: Uint8Array) { objects.set(key, bytes); }, async get(key: string) { const bytes = objects.get(key); return bytes ? { body: bytes } : null; }, async delete(key: string) { objects.delete(key); } }, ADMIN_OWNER_EMAIL: 'owner@example.test', DB: { prepare: (q: string) => new Statement(q), async batch(statements: Statement[]) { sql.exec('BEGIN'); try {
            const results = [];
            for (const s of statements)
                results.push(await s.run());
            sql.exec('COMMIT');
            return results;
        }
        catch (e) {
            sql.exec('ROLLBACK');
            throw e;
        } } } };
export let currentUser: {
    userId: string;
    email: string;
    displayName: string;
    fullName: null;
} | null = null;
export function setUser(email: string | null, id = 'user-' + email) { currentUser = email ? { userId: id, email, displayName: email, fullName: null } : null; }
export async function getChatGPTUser() { return currentUser; }
