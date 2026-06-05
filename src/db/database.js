import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('boardmate.db');

export const initDatabase = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS boardmates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date_started TEXT NOT NULL,
      mobile TEXT NOT NULL,
      started_kwh REAL NOT NULL,
      gender TEXT NOT NULL,
      rent_price REAL,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS electric_bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month TEXT NOT NULL,
      meralco_charge REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS electric_bill_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER,
      boardmate_id INTEGER,
      new_kwh REAL NOT NULL,
      total_due REAL NOT NULL,
      is_paid INTEGER DEFAULT 0,
      FOREIGN KEY (bill_id) REFERENCES electric_bills(id),
      FOREIGN KEY (boardmate_id) REFERENCES boardmates(id)
    );

    CREATE TABLE IF NOT EXISTS water_bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month TEXT NOT NULL,
      total_amount REAL NOT NULL,
      per_person REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS water_bill_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      water_bill_id INTEGER,
      boardmate_id INTEGER,
      amount REAL NOT NULL,
      is_paid INTEGER DEFAULT 0,
      FOREIGN KEY (water_bill_id) REFERENCES water_bills(id),
      FOREIGN KEY (boardmate_id) REFERENCES boardmates(id)
    );

    CREATE TABLE IF NOT EXISTS rent_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      default_price REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rent_bill_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month TEXT NOT NULL,
      boardmate_id INTEGER,
      amount REAL NOT NULL,
      is_paid INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (boardmate_id) REFERENCES boardmates(id)
    );
  `);
};

export default db;