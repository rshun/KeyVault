// 导入 sqlite3 模块
const sqlite3 = require('sqlite3').verbose();

// 定义数据库文件名
const DBSOURCE = process.env.DATABASE_PATH || "keyvault.db";

// 连接到 SQLite 数据库。如果文件不存在，会自动创建。
const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
      // 无法连接数据库
      console.error(err.message);
      throw err;
    } else {
        console.log('已成功连接到 SQLite 数据库。');
        // 运行建表语句
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE, 
            config_password_hash TEXT,
            CONSTRAINT username_unique UNIQUE (username)
            )`,
        (err) => {
            if (err) { /* 表已存在 */ } 
            else { console.log('成功创建 users 表。'); }
        });

        // 新增：创建 vault_items 表 (如果不存在)
        db.run(`CREATE TABLE IF NOT EXISTS vault_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            web_name TEXT,
            web_addr TEXT,
            login_name TEXT,
            password_length TEXT,
            allow_spec TEXT,
            key_type TEXT,
            update_time INTEGER,
            memo TEXT,
            web_icon TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )`,
        (err) => {
             if (err) { /* 表已存在 */ }
             else { console.log('成功创建 vault_items 表。'); }
        });  
    }
});

// 导出数据库连接对象，以便在其他文件中使用
module.exports = db;
