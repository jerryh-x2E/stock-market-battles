const bcrypt = require("bcrypt");
const pool = require("../db.js");
const saltRounds = 10;

function signUp(username, password) {
    if (username.length < 3 || username.length > 24) {
        return Promise.resolve({ 
            code: 400, 
            msg: "Username must be between 3 and 24 characters long" 
        });
    }
    if (password.length < 6) {
        return Promise.resolve({
            code: 400,
            msg: "Password must be at least 6 characters long"
        });
    }
    const hash = bcrypt.hashSync(password, saltRounds);
    return pool.query(
        "INSERT INTO users (username, pw_hash) VALUES ($1, $2)", 
        [username, hash]
    ).then(result => {
        return { code: 200, msg: "OK" }; 
    }).catch(error => {
        if (error.code === 23505) { // Unique Constraint Violation
            return { code: 400, msg: "Player with this username already exists" };
        }
        return { code: 500, msg: "An error occurred" };
    });
}

function checkLogin(username, password) {
    return pool.query(
        `SELECT username, pw_hash 
        FROM users WHERE username = $1`, [username]
    ).then(result => {
        if (result.rowCount === 0) {
            return false;
        }
        const passwordHash = result.rows[0].pw_hash;
        return bcrypt.compare(password, passwordHash);
    });
}

function checkUsername(username) {
    return pool.query(
        "SELECT username FROM users WHERE username = $1", [username]
    ).then(result => result.rowCount === 0);
}

function getUserId(username) {
    return pool.query(
        "SELECT id FROM users WHERE username = $1", [username]
    ).then(result => result.rows[0]);
}

module.exports = { signUp, checkLogin, checkUsername };