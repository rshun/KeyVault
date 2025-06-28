const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 从环境变量获取工作区路径
const WORKSPACE_PATH = process.env.WORKSPACE_PATH;
if (!WORKSPACE_PATH) {
    // 如果没有工作区路径，数据库模块不能工作
    console.error("错误：工作区路径未设置。数据库无法初始化。");
    // 抛出错误或以其他方式处理，确保应用不会在没有有效路径的情况下继续
    throw new Error("Workspace path is not defined.");
}

const USER_DB_SOURCE = path.join(WORKSPACE_PATH, 'users.db');

const userDB = new sqlite3.Database(USER_DB_SOURCE, (err) => {
    if (err) {
      console.error("连接用户数据库失败:", err.message);
      throw err;
    }
    console.log('已成功连接到主用户数据库:', USER_DB_SOURCE);
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
        if (err) console.error("创建 users 表失败:", err.message);
    });
});

function createUserVault(dbPath) {
    return new Promise((resolve, reject) => {
        // 确保保险库文件夹存在
        const absoluteDbPath =  path.join(WORKSPACE_PATH, 'vaults', dbPath);
        const vaultDir = path.dirname(absoluteDbPath);
        if (!fs.existsSync(vaultDir)) {
            fs.mkdirSync(vaultDir, { recursive: true });
        }

        const vaultDb = new sqlite3.Database(absoluteDbPath, (err) => {
            if (err) {
                return reject(new Error(`创建或连接用户密码库失败 at ${absoluteDbPath}: ${err.message}`));
            }
            const vaultTableSql = `
            CREATE TABLE IF NOT EXISTS vault_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                web_name TEXT, web_addr TEXT, login_name TEXT, password_length TEXT,
                allow_spec TEXT, key_type TEXT, update_time INTEGER, memo TEXT, web_icon TEXT,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )`;
            vaultDb.run(vaultTableSql, (err) => {
                vaultDb.close((closeErr) => {
                    if (err || closeErr) {
                        return reject(err || closeErr);
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
    getWorkspacePath: () => WORKSPACE_PATH, // 导出工作区路径给其他后端模块使用
};