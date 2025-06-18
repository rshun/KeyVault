const express = require('express');
const cors = require('cors');
const { userDB, createUserVault, getUserVaultConnection } = require('./database.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const CryptoJS = require("crypto-js");

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;
const JWT_SECRET = 'your-super-secret-key-that-should-be-in-an-env-file';

app.use(cors());
app.use(express.json());

// --- 辅助函数：加密 & 解密 ---
const encrypt = (text, key) => {
    if (text === null || typeof text === 'undefined') text = '';
    if (typeof text !== 'string') text = String(text);
    return CryptoJS.AES.encrypt(text, key).toString();
};
const decrypt = (text, key) => {
    if (text === null || typeof text === 'undefined') return '';
    const bytes = CryptoJS.AES.decrypt(text, key);
    return bytes.toString(CryptoJS.enc.Utf8);
};

// =================================================================
// ** C-to-JS ALGORITHM TRANSLATION START **
// (这部分代码无需修改，保持原样即可)
// =================================================================
const PasswordGenerator = {
    LOOP: 2, UPPER_RATIO: 20, SHA512_LEN: 129, ALPHABET: "abcdefghijklmnopqrstuvwxyz", DIGIT: "0123456789",
    util_strlen: (s) => (s ? s.length : 0), isalpha: (c) => typeof c === 'string' && /^[a-zA-Z]$/.test(c), isdigit: (c) => typeof c === 'string' && /^[0-9]$/.test(c), islower: (c) => typeof c === 'string' && /^[a-z]$/.test(c), toupper: (c) => (typeof c === 'string' ? c.toUpperCase() : c),
    util_ch2num: (s_char) => { const v = parseInt(s_char, 10); return isNaN(v) || v < 1 || v > 9 ? 0 : v; },
    util_sha384: (data) => CryptoJS.SHA384(data).toString(CryptoJS.enc.Hex), util_sha512: (data) => CryptoJS.SHA512(data).toString(CryptoJS.enc.Hex),
    util_invert: function(s1, len) { let s_len = this.util_strlen(s1); if (s_len === 0 || len <= 1) return ""; if (s_len >= len) s_len = len - 1; return s1.substring(0, s_len).split('').reverse().join(''); },
    util_sumchar: function(s_str) { let v = 0; if (!s_str) return v; for (let i = 0; i < s_str.length; i++) { v += this.util_ch2num(s_str[i]); } return v; },
    util_gdigit: function(s_str) { let v = 0; if (!s_str) return v; for (let i = 0; i < s_str.length; i++) { v += s_str.charCodeAt(i); } return v; },
    util_galpha: function(v) { return this.ALPHABET[v % 26]; },
    util_char2spec: function(s_char) { const map = { '1': '!', '2': '@', '3': '#', '4': '$', '5': '%', '6': ';', '7': ':', '8': '+', '9': '(', '0': ')' }; return map[s_char] || s_char; },
    _splitKeyLen: function(s) { const info = { alphalen: 0, upperlen: 0, digitlen: 0, spechlen: 0 }; switch (this.util_strlen(s)) { case 3: info.alphalen = this.util_ch2num(s[0]); info.digitlen = this.util_ch2num(s[1]); info.spechlen = this.util_ch2num(s[2]); break; case 4: info.alphalen = this.util_ch2num(s[0]) * 10 + this.util_ch2num(s[1]); info.digitlen = this.util_ch2num(s[2]); info.spechlen = this.util_ch2num(s[3]); if (info.alphalen > 52) info.alphalen = 8; break; default: info.alphalen = 8; info.digitlen = 1; info.spechlen = 1; break; } if ((info.alphalen === 0) && (info.digitlen === 0)) { info.alphalen = 8; info.digitlen = 1; info.spechlen = 1; } if (info.alphalen + info.digitlen + info.spechlen < 6) { info.alphalen = 8; info.digitlen = 1; info.spechlen = 1; } const total = info.alphalen + info.digitlen + info.spechlen; if (info.alphalen > 0) { for (let i = 0; i < total; i++) { if (((i / total) * 100) - this.UPPER_RATIO >= -0.004) { info.upperlen = i; info.alphalen -= i; break; } } } return { info, total }; },
    _rmDupStr: function(str, slen) { const usedChars = new Set(str.split('')); const unusedChars = this.ALPHABET.split('').filter(char => !usedChars.has(char)); if (unusedChars.length === 0) return this.ALPHABET[Math.floor(Math.random() * this.ALPHABET.length)]; let v = 1; for (let i = 0; i < str.length; i++) v += str.charCodeAt(i) * (i + slen); return unusedChars[v % unusedChars.length]; },
    _rmDupDigit: function(str, slen) { const usedDigits = new Set(str.split('').filter(c => this.isdigit(c))); const unusedDigits = this.DIGIT.split('').filter(d => !usedDigits.has(d)); if (unusedDigits.length === 0) return this.DIGIT[Math.floor(Math.random() * this.DIGIT.length)]; let v = 1; for (let i = 0; i < str.length; i++) v += str.charCodeAt(i) * (i + slen); return unusedDigits[v % unusedDigits.length]; },
    _splitstring: function(s) { let digit = '', alphabet = ''; for (const char of s) { if (this.isdigit(char)) digit += char; if (this.isalpha(char)) alphabet += char; } return { digit, alphabet }; },
    _rawcode: function(s) { let temp2 = s; for (let i = 0; i < this.LOOP; i++) { const temp1 = this.util_sha384(temp2); temp2 = this.util_invert(temp1, this.SHA512_LEN); const temp1_sha512 = this.util_sha512(temp2); temp2 = this.util_invert(temp1_sha512, this.SHA512_LEN); } return this._splitstring(temp2); },
    _basecode: function(p, q, len) { let newStr = ""; for (let i = 0, p_ptr = 0, q_ptr = 0; i < len; i++) { let char = this.util_galpha(this.util_sumchar(p.substring(p_ptr)) + this.util_gdigit(q.substring(q_ptr))); if (newStr.length < 26 && newStr.includes(char)) { char = this._rmDupStr(newStr, len); } newStr += char; i % 2 === 0 ? p_ptr++ : q_ptr++; } return newStr; },
    _convert: function(p, q, dst_array, len, pwdLen, flag) { if (len === 0) return dst_array; if (len === pwdLen) { for (let i = 0, p_ptr = 0, q_ptr = 0; i < len; i++, p_ptr++, q_ptr++) { let char; const p_sub = p.substring(p_ptr), q_sub = q.substring(q_ptr); if (i % 2 !== 0) { char = p[(this.util_sumchar(p_sub) * this.util_gdigit(q_sub)) % this.util_strlen(p)]; } else { let index = (this.util_gdigit(q_sub) - this.util_sumchar(p_sub)) % this.util_strlen(p); char = p[index < 0 ? index + this.util_strlen(p) : index]; } if (dst_array.join('').includes(char)) { char = this._rmDupDigit(dst_array.join(''), len); } dst_array[i] = char; } } else { let i = 0, p_ptr = 0, q_ptr = 0; while(i < len) { const p_sub = p.substring(p_ptr); const q_sub = q.substring(q_ptr); if (this.util_strlen(p_sub) === 0 || this.util_strlen(q_sub) === 0) break; const j = (this.util_sumchar(p_sub) + this.util_gdigit(q_sub)) % pwdLen; if (this.islower(dst_array[j])) { i++; const replacementChar = p[j % this.util_strlen(p)]; switch (flag) { case 1: dst_array[j] = this.util_char2spec(replacementChar); break; case 2: dst_array[j] = replacementChar; break; case 3: dst_array[j] = this.toupper(dst_array[j]); break; } } p_ptr++; q_ptr++; } } return dst_array; },
    _specStr: function(s_array, specstr) { if (!specstr) return s_array; return s_array.map((char, index) => { if (this.isdigit(char) || this.isalpha(char)) return char; if (!specstr.includes(char)) return specstr[index % this.util_strlen(specstr)]; return char; }); },
    _lowstrpos: function(s_array) { if (s_array.length === 0 || this.isalpha(s_array[0])) return s_array; const firstLetterIndex = s_array.findIndex(c => this.isalpha(c)); if (firstLetterIndex > 0) { [s_array[0], s_array[firstLetterIndex]] = [s_array[firstLetterIndex], s_array[0]]; } return s_array; },
    generate: function(s, pwdlen, spec, codelen) { if (this.util_strlen(s) === 0 || this.util_strlen(s) >= this.SHA512_LEN) return null; const { info: myKeyInfo, total: passwordLen } = this._splitKeyLen(pwdlen); if (codelen <= passwordLen) return null; const { digit: digit_str, alphabet: alpha_str } = this._rawcode(s); let code = this._basecode(digit_str, alpha_str, passwordLen); let code_array = code.split(''); code_array = this._convert(digit_str, alpha_str, code_array, myKeyInfo.spechlen, passwordLen, 1); code_array = this._convert(digit_str, alpha_str, code_array, myKeyInfo.digitlen, passwordLen, 2); code_array = this._convert(digit_str, alpha_str, code_array, myKeyInfo.upperlen, passwordLen, 3); if (myKeyInfo.alphalen > 0) { code_array = this._lowstrpos(code_array); } if (this.util_strlen(spec) > 0) { code_array = this._specStr(code_array, spec); } return code_array.join(''); }
};
// =================================================================
// ** C ALGORITHM TRANSLATION END **
// =================================================================

const generatePasswordWrapper = (item, mainPassword) => {
    let rawString = "";
    try {
        const fullUrl = item.webAddr.startsWith('http') ? item.webAddr : `http://${item.webAddr}`;
        const url = new URL(fullUrl);
        let hostname = url.hostname;
        if (hostname.startsWith('www.')) hostname = hostname.substring(4);
        rawString += hostname;
    } catch (e) {
        rawString += item.webAddr;
    }
    rawString += mainPassword;
    rawString += item.loginName;
    rawString += (item.updateTime || 1);
    if (item.keyType) rawString += item.keyType;
    return PasswordGenerator.generate(rawString, item.passwordLength, item.allowSpec, 512);
};

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

app.post('/api/register', (req, res) => {
    const { username, password, path: db_path } = req.body;
    if (!username || !password || !db_path) {
        return res.status(400).json({ success: false, message: "用户名、密码和路径都不能为空！" });
    }
    bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {
        if (err) {
            return res.status(500).json({ success: false, message: "服务器内部错误" });
        }
        const insertUserSql = 'INSERT INTO users (username, password_hash, db_path, created_at, updated_at) VALUES (?, ?, ?, ?, ?)';
        const currentTime = new Date().toISOString();
        const params = [username, hash, db_path, currentTime, currentTime];
        userDB.run(insertUserSql, params, async function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                   return res.status(409).json({ success: false, message: "注册失败：该用户名已被占用。" });
                }
                return res.status(400).json({ success: false, message: err.message });
            }
            try {
                await createUserVault(db_path);
                res.status(201).json({ success: true, message: "用户注册成功！", userId: this.lastID });
            } catch (vaultError) {
                userDB.run('DELETE FROM users WHERE id = ?', [this.lastID]);
                res.status(500).json({ success: false, message: `创建密码库文件失败: ${vaultError.message}` });
            }
        });
    });
});

app.post('/api/login', (req, res) => {
    const { username, configPassword } = req.body;
    const sql = "SELECT * FROM users WHERE username = ?";
    userDB.get(sql, [username], (err, user) => {
        if (err) return res.status(500).json({ success: false, message: "数据库查询错误" });
        if (!user) return res.status(401).json({ success: false, message: "用户名或配置文件密码错误" });
        bcrypt.compare(configPassword, user.password_hash, (err, isMatch) => {
            if (err) return res.status(500).json({ success: false, message: "密码验证时出错" });
            if (isMatch) {
                const payload = { id: user.id, username: user.username, db_path: user.db_path };
                const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
                res.status(200).json({ success: true, message: "登录成功！", token: token });
            } else {
                res.status(401).json({ success: false, message: "用户名或配置文件密码错误" });
            }
        });
    });
});

// ********** CORRECTED API ENDPOINT **********
app.post('/api/data', verifyToken, (req, res) => {
    const { db_path } = req.user;
    const { configPassword, mainPassword } = req.body;
    if (!configPassword || !mainPassword || !db_path) {
        return res.status(400).json({ success: false, message: "缺少必要的参数或认证信息" });
    }
    getUserVaultConnection(db_path, (err, vaultDb) => {
        if (err) {
            return res.status(500).json({ success: false, message: `无法打开您的密码库文件，请检查路径和文件权限。错误: ${err.message}` });
        }
        const sql = "SELECT * FROM vault_items";
        vaultDb.all(sql, [], (err, rows) => {
            vaultDb.close(); 
            if (err) return res.status(400).json({ "error": err.message });
            try {
                const decryptedRows = rows.map(item => ({
                    id: item.id, userId: item.user_id, webName: decrypt(item.web_name, configPassword),
                    webAddr: decrypt(item.web_addr, configPassword), loginName: decrypt(item.login_name, configPassword),
                    passwordLength: decrypt(item.password_length, configPassword), allowSpec: decrypt(item.allow_spec, configPassword),
                    keyType: decrypt(item.key_type, configPassword), updateTime: parseInt(decrypt(item.update_time, configPassword), 10),
                    Memo: decrypt(item.memo, configPassword), webIcon: decrypt(item.web_icon, configPassword),
                }));
                decryptedRows.sort((a, b) => (a.webName || '').localeCompare(b.webName || ''));
                const finalData = decryptedRows.map(item => ({ ...item, password: generatePasswordWrapper(item, mainPassword) }));
                res.json({ success: true, data: finalData });
            } catch (error) {
                res.status(403).json({ success: false, message: "配置文件密码不正确或数据格式有误" });
            }
        });
    });
});

app.post('/api/password/regenerate', verifyToken, (req, res) => {
    const { itemData, mainPassword } = req.body;
    if (!itemData || !mainPassword) {
        return res.status(400).json({ success: false, message: "缺少必要的密码参数" });
    }
    try {
        const newPassword = generatePasswordWrapper(itemData, mainPassword);
        res.json({ success: true, newPassword: newPassword });
    } catch(error) {
        res.status(500).json({ success: false, message: "密码生成时发生错误" });
    }
});

app.put('/api/data/batch-update', verifyToken, (req, res) => {
    const { id: userId, db_path } = req.user;
    const { items, configPassword } = req.body;
    if (!Array.isArray(items) || !configPassword || !db_path) {
        return res.status(400).json({ success: false, message: "请求格式不正确" });
    }
    getUserVaultConnection(db_path, (err, vaultDb) => {
        if (err) {
            return res.status(500).json({ success: false, message: `无法打开您的密码库文件。错误: ${err.message}` });
        }
        vaultDb.serialize(() => {
            vaultDb.run("BEGIN TRANSACTION", (err) => { 
                if (err) {
                    vaultDb.close();
                    return res.status(500).json({ success: false, message: "数据库事务开启失败" });
                } 
            });
            const results = { created: 0, updated: 0, failed: 0 };
            const newIdMap = {};
            const promises = items.map(item => {
                return new Promise((resolve) => {
                    const encryptedData = {
                        web_name: encrypt(item.webName, configPassword), web_addr: encrypt(item.webAddr, configPassword),
                        login_name: encrypt(item.loginName, configPassword), password_length: encrypt(String(item.passwordLength), configPassword),
                        allow_spec: encrypt(item.allowSpec, configPassword), key_type: encrypt(item.keyType, configPassword),
                        update_time: encrypt(String(item.updateTime), configPassword), memo: encrypt(item.Memo, configPassword), web_icon: encrypt(item.webIcon, configPassword)
                    };
                    if (item.isNew) {
                        const columns = ['user_id', ...Object.keys(encryptedData)];
                        const placeholders = columns.map(() => '?').join(',');
                        const sql = `INSERT INTO vault_items (${columns.join(',')}) VALUES (${placeholders})`;
                        const params = [userId, ...Object.values(encryptedData)];
                        vaultDb.run(sql, params, function(err) {
                            if (err) { results.failed++; } 
                            else { results.created++; newIdMap[item.id] = this.lastID; }
                            resolve();
                        });
                    } else {
                        const setClauses = Object.keys(encryptedData).map(key => `${key} = ?`).join(', ');
                        const sql = `UPDATE vault_items SET ${setClauses} WHERE id = ?`;
                        const params = [...Object.values(encryptedData), item.id];
                        vaultDb.run(sql, params, function(err) {
                            if (err) { results.failed++; } 
                            else if (this.changes > 0) { results.updated++; }
                            resolve();
                        });
                    }
                });
            });
            Promise.all(promises).then(() => {
                const finalAction = results.failed > 0 ? "ROLLBACK" : "COMMIT";
                vaultDb.run(finalAction, (err) => {
                    vaultDb.close();
                    if (err) {
                        return res.status(500).json({ success: false, message: `数据库事务${finalAction}失败` });
                    }
                    if (finalAction === "ROLLBACK") {
                        return res.status(500).json({ success: false, message: "批量保存时发生错误，操作已回滚。" });
                    }
                    res.status(200).json({
                        success: true,
                        message: `批量保存完成：${results.created}条创建，${results.updated}条更新。`,
                        results,
                        newIdMap
                    });
                });
            }).catch((e) => {
                vaultDb.run("ROLLBACK", () => vaultDb.close());
                res.status(500).json({ success: false, message: `批量保存时发生未知服务器错误: ${e.message}` });
            });
        });
    });
});

app.put('/api/data/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    const { db_path } = req.user;
    const { itemData, configPassword } = req.body;
    if (!itemData || !configPassword || !db_path) {
        return res.status(400).json({ success: false, message: "缺少必要数据或认证信息" });
    }
    getUserVaultConnection(db_path, (err, vaultDb) => {
        if (err) {
            return res.status(500).json({ success: false, message: `无法打开您的密码库文件。错误: ${err.message}` });
        }
        const encryptedData = {
            web_name: encrypt(itemData.webName, configPassword), web_addr: encrypt(itemData.webAddr, configPassword),
            login_name: encrypt(itemData.loginName, configPassword), password_length: encrypt(String(itemData.passwordLength), configPassword),
            allow_spec: encrypt(itemData.allowSpec, configPassword), key_type: encrypt(itemData.keyType, configPassword),
            update_time: encrypt(String(itemData.updateTime), configPassword), memo: encrypt(itemData.Memo, configPassword),
            web_icon: encrypt(itemData.webIcon, configPassword)
        };
        const setClauses = Object.keys(encryptedData).map(key => `${key} = ?`).join(', ');
        const sql = `UPDATE vault_items SET ${setClauses} WHERE id = ?`;
        const params = [...Object.values(encryptedData), id];
        vaultDb.run(sql, params, function(err) {
            vaultDb.close();
            if (err) {
                return res.status(400).json({ success: false, message: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: "记录未找到或权限不足" });
            }
            res.json({ success: true, message: `记录 ${id} 已成功更新` });
        });
    });
});

app.delete('/api/data/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    const { db_path } = req.user;
    if (!db_path) {
        return res.status(400).json({ success: false, message: "缺少认证信息" });
    }
    getUserVaultConnection(db_path, (err, vaultDb) => {
        if (err) {
            return res.status(500).json({ success: false, message: `无法打开您的密码库文件。错误: ${err.message}` });
        }
        const sql = 'DELETE FROM vault_items WHERE id = ?';
        vaultDb.run(sql, [id], function(err) {
            vaultDb.close();
            if (err) return res.status(400).json({ success: false, message: err.message });
            if (this.changes === 0) return res.status(404).json({ success: false, message: "记录未找到" });
            res.json({ success: true, message: "记录已删除" });
        });
    });
});

app.listen(PORT, () => {
  console.log(`后端服务器已启动，正在监听 http://localhost:${PORT}`);
  console.log('Backend started');
});