// SQLite database — connection singleton

import Database from "better-sqlite3"
import { existsSync, renameSync, chmodSync } from "fs"
import { createTables } from "./db-schema"
import { runMigrations } from "./db-migrate"
import { runSeeds } from "./db-seed"

const NEW_DB_PATH = "/root/.openclaw/mission-control.db"
const OLD_DB_PATH = "/root/.openclaw/tasks.db"

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!_db) {
    if (!existsSync(NEW_DB_PATH) && existsSync(OLD_DB_PATH)) {
      renameSync(OLD_DB_PATH, NEW_DB_PATH)
    }
    _db = new Database(NEW_DB_PATH)
    _db.pragma("journal_mode = WAL")
    _db.pragma("foreign_keys = ON")
    createTables(_db)
    runMigrations(_db)
    runSeeds(_db)
    try { chmodSync(NEW_DB_PATH, 0o600) } catch { /* may fail in dev */ }
  }
  return _db
}
