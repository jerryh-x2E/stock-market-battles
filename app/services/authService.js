const pool = require("../db.js");

function insertToken(token, userId) {
    return pool.query(
        `INSERT INTO sessions (token, user_id)
        VALUES ($1, $2)`, [token, userId]
    ).then(response => true).catch(error => false);
}

function deleteSession(token) {
    return pool.query("DELETE FROM sessions WHERE token = $1", [token]).then(result => undefined);
}

function getSessionUser(token) {
    return pool.query(
        "SELECT user_id FROM sessions WHERE token = $1", [token]
    ).then(result => {
        if (result.rowCount === 1) {
            return result.rows[0].user_id;
        }
        throw new RangeError();
    });
}

module.exports = { insertToken, deleteSession, getSessionUser };