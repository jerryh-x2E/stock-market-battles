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

function getPrice(ticker) {
    return pool.query(
        "SELECT price FROM stock_prices WHERE ticker = $1",
        [ticker]
    ).then(result => {
        if (result.rowCount === 0) {
            return null;
        }
        return Number(result.rows[0].price);
    });
}

function inRunningGame(userId, game) {
    return pool.query(
        `SELECT 1
         FROM user_games ug
         JOIN games g ON g.game_code = ug.game
         WHERE ug.user_id = $1 AND ug.game = $2 AND ug.joined = TRUE
           AND g.start_date <= NOW() AND NOW() < g.start_date + g.length`,
        [userId, game]
    ).then(result => result.rowCount === 1);
}
 
function addShares(userId, game, ticker, shares) {
    return pool.query(
        `UPDATE user_games
         SET tickers = CASE
                 WHEN $3::varchar = ANY(COALESCE(tickers, '{}')) THEN tickers
                 ELSE array_append(COALESCE(tickers, '{}'), $3::varchar)
             END,
             balances = CASE
                 WHEN $3::varchar = ANY(COALESCE(tickers, '{}')) THEN
                     (SELECT array_agg(CASE WHEN t = $3 THEN b + $4 ELSE b END ORDER BY n)
                      FROM unnest(tickers, balances) WITH ORDINALITY AS u(t, b, n))
                 ELSE array_append(COALESCE(balances, '{}'), $4::numeric)
             END
         WHERE user_id = $1 AND game = $2`,
        [userId, game, ticker, shares]
    ).then(result => result.rowCount === 1);
}
 
function removeShares(userId, game, ticker, shares) {
    return pool.query(
        `UPDATE user_games
         SET tickers = (SELECT COALESCE(array_agg(t ORDER BY n), '{}')
                        FROM unnest(tickers, balances) WITH ORDINALITY AS u(t, b, n)
                        WHERE NOT (t = $3 AND b = $4)),
             balances = (SELECT COALESCE(array_agg(CASE WHEN t = $3 THEN b - $4 ELSE b END ORDER BY n), '{}')
                         FROM unnest(tickers, balances) WITH ORDINALITY AS u(t, b, n)
                         WHERE NOT (t = $3 AND b = $4))
         WHERE user_id = $1 AND game = $2
           AND EXISTS (SELECT 1 FROM unnest(tickers, balances) AS u(t, b)
                       WHERE t = $3 AND b >= $4)`,
        [userId, game, ticker, shares]
    ).then(result => result.rowCount === 1);
}
 
function checkInput(ticker, shares) {
    if (typeof ticker !== "string" || !/^[A-Za-z.]{1,5}$/.test(ticker)) {
        return { code: 400, msg: "Enter a valid ticker" };
    }
    if (!Number.isInteger(shares) || shares <= 0) {
        return { code: 400, msg: "Shares must be a whole number above 0" };
    }
    return null;
}
 
function buyStock(userId, game, ticker, shares) {
    const error = checkInput(ticker, shares);
    if (error) {
        return Promise.resolve(error);
    }
    ticker = ticker.toUpperCase();
 
    return inRunningGame(userId, game).then(playing => {
        if (!playing) {
            return { code: 404, msg: "You're not in this game, or it isn't running" };
        }
        return getPrice(ticker).then(price => {
            if (price === null) {
                return { code: 400, msg: "Unknown ticker" };
            }
            const cost = Math.round(price * shares * 100) / 100;
 
            return spend(userId, game, cost).then(paid => {
                if (paid.code !== 200) {
                    return paid;                            // "Not enough cash"
                }
                return addShares(userId, game, ticker, shares).then(added => {
                    if (!added) {
                        // Shares couldn't be added, so give the money back.
                        return recieve(userId, game, cost).then(() => {
                            return { code: 500, msg: "An error occurred" };
                        });
                    }
                    return { code: 200, msg: `Bought ${shares} ${ticker} at $${price.toFixed(2)}`, balance: paid.balance };
                });
            });
        });
    }).catch(() => {
        return { code: 500, msg: "An error occurred" };
    });
}
 
function sellStock(userId, game, ticker, shares) {
    const error = checkInput(ticker, shares);
    if (error) {
        return Promise.resolve(error);
    }
    ticker = ticker.toUpperCase();
 
    return inRunningGame(userId, game).then(playing => {
        if (!playing) {
            return { code: 404, msg: "You're not in this game, or it isn't running" };
        }
        return getPrice(ticker).then(price => {
            if (price === null) {
                return { code: 400, msg: "Unknown ticker" };
            }
            const proceeds = Math.round(price * shares * 100) / 100;
 
            return removeShares(userId, game, ticker, shares).then(removed => {
                if (!removed) {
                    return { code: 400, msg: `You don't own ${shares} shares of ${ticker}` };
                }
                return recieve(userId, game, proceeds).then(got => {
                    if (got.code !== 200) {
                        return got;
                    }
                    return { code: 200, msg: `Sold ${shares} ${ticker} at $${price.toFixed(2)}`, balance: got.balance };
                });
            });
        });
    }).catch(() => {
        return { code: 500, msg: "An error occurred" };
    });
}
 
module.exports = { spend, recieve, buyStock, sellStock };