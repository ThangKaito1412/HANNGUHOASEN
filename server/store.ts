import fs from 'fs';
import path from 'path';

/**
 * Kho dữ liệu dạng "tài liệu" (collection/id -> JSON).
 *  - Có DATABASE_URL  -> PostgreSQL (dữ liệu bền vững, nên dùng khi chạy thật).
 *  - Không có         -> file data/db.json (chỉ để chạy thử; trên Render gói Free sẽ MẤT khi deploy lại).
 */
export interface Store {
  kind: 'postgres' | 'file';
  init(): Promise<void>;
  list(col: string): Promise<{id: string; data: any}[]>;
  get(col: string, id: string): Promise<any | null>;
  put(col: string, id: string, data: any): Promise<void>;
  del(col: string, id: string): Promise<void>;
}

class FileStore implements Store {
  kind = 'file' as const;
  private file: string;
  private db: Record<string, Record<string, any>> = {};
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    const dir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
    fs.mkdirSync(dir, {recursive: true});
    this.file = path.join(dir, 'db.json');
  }
  async init() {
    try {
      this.db = JSON.parse(fs.readFileSync(this.file, 'utf8'));
    } catch {
      this.db = {};
    }
  }
  private flush() {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      const tmp = this.file + '.tmp';
      fs.writeFile(tmp, JSON.stringify(this.db), (err) => {
        if (!err) fs.rename(tmp, this.file, () => {});
      });
    }, 300);
  }
  async list(col: string) {
    return Object.entries(this.db[col] || {}).map(([id, data]) => ({id, data}));
  }
  async get(col: string, id: string) {
    return this.db[col]?.[id] ?? null;
  }
  async put(col: string, id: string, data: any) {
    (this.db[col] ||= {})[id] = data;
    this.flush();
  }
  async del(col: string, id: string) {
    if (this.db[col]) delete this.db[col][id];
    this.flush();
  }
}

class PgStore implements Store {
  kind = 'postgres' as const;
  private pool: any;
  constructor(private url: string) {}
  async init() {
    const {default: pg} = await import('pg');
    const local = /localhost|127\.0\.0\.1/.test(this.url);
    this.pool = new pg.Pool({
      connectionString: this.url,
      ssl: local ? undefined : {rejectUnauthorized: false},
      max: 5,
    });
    await this.pool.query(
      'create table if not exists kv (col text not null, id text not null, data jsonb not null, primary key (col, id))'
    );
  }
  async list(col: string) {
    const r = await this.pool.query('select id, data from kv where col = $1', [col]);
    return r.rows.map((x: any) => ({id: x.id, data: x.data}));
  }
  async get(col: string, id: string) {
    const r = await this.pool.query('select data from kv where col = $1 and id = $2', [col, id]);
    return r.rows[0]?.data ?? null;
  }
  async put(col: string, id: string, data: any) {
    await this.pool.query(
      'insert into kv (col, id, data) values ($1, $2, $3) on conflict (col, id) do update set data = excluded.data',
      [col, id, JSON.stringify(data)]
    );
  }
  async del(col: string, id: string) {
    await this.pool.query('delete from kv where col = $1 and id = $2', [col, id]);
  }
}

export async function createStore(): Promise<Store> {
  const url = process.env.DATABASE_URL;
  const store: Store = url ? new PgStore(url) : new FileStore();
  await store.init();
  return store;
}
