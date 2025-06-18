const sqlite3 = require('sqlite3').verbose();

// 主用户数据库，固定文件名
const USER_DB_SOURCE = process.env.USER_DB_PATH || "users.db";

// 连接到主用户数据库
const userDB = new sqlite3.Database(USER_DB_SOURCE, (err) => {
    if (err) {
      console.error("连接用户数据库失败:", err.message);
      throw err;
    } else {
        console.log('已成功连接到主用户数据库 (users.db)。');
        const sql = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            db_path TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            CONSTRAINT username_unique UNIQUE (username)
        )`;
        userDB.run(sql, (err) => {
            if (err) {
                console.error("创建 users 表失败:", err.message);
            } else {
                console.log('成功初始化 users 表。');
            }
        });
    }
});

/**
 * 在指定路径创建一个新的用户密码库文件，并初始化表结构。
 * @param {string} dbPath 用户选择的数据库文件路径
 * @returns {Promise<void>} 操作完成时解析的 Promise
 */
function createUserVault(dbPath) {
    return new Promise((resolve, reject) => {
        const vaultDb = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                return reject(new Error(`创建或连接用户密码库失败 at ${dbPath}: ${err.message}`));
            }
            console.log(`已成功创建/连接用户密码库: ${dbPath}`);

            const vaultTableSql = `
            CREATE TABLE IF NOT EXISTS vault_items (
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
            )`;

            vaultDb.run(vaultTableSql, (err) => {
                if (err) {
                    vaultDb.close();
                    return reject(new Error(`在 ${dbPath} 中创建 vault_items 表失败: ${err.message}`));
                }
                console.log(`在 ${dbPath} 中成功初始化 vault_items 表。`);
                vaultDb.close((err) => {
                    if (err) {
                       return reject(new Error(`关闭数据库连接失败 for ${dbPath}: ${err.message}`));
                    }
                    resolve();
                });
            });
        });
    });
}


module.exports = {
    userDB,
    createUserVault,
    // 辅助函数，用于在 API 请求中连接到指定的用户密码库
    getUserVaultConnection: (dbPath) => new sqlite3.Database(dbPath)
};