const pool = require("../db.js");

function spend(userId, game, amount) {
    return pool.query(
        `UPDATE user_games
         SET balance = balance - $1
         WHERE user_id = $2 AND game = $3 AND balance >= $1
         RETURNING balance`,
        [amount, userId, game]
    ).then(result => {
        if (result.rowCount === 0) {
            return { code: 400, msg: "Not enough cash" };
        }
        return { code: 200, msg: "OK", balance: Number(result.rows[0].balance) };
    }).catch(() => {
        return { code: 500, msg: "An error occurred" };
    });
}

function recieve(userId, game, amount) {
    return pool.query(
        `UPDATE user_games
         SET balance = balance + $1
         WHERE user_id = $2 AND game = $3
         RETURNING balance`,
        [amount, userId, game]
    ).then(result => {
        if (result.rowCount === 0) {
            return { code: 404, msg: "Player not in this game" };
        }
        return { code: 200, msg: "OK", balance: Number(result.rows[0].balance) };
    }).catch(() => {
        return { code: 500, msg: "An error occurred" };
    });
}

module.exports = { spend, recieve };