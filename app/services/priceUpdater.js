const pool = require("../db.js");
const env = require("../../env.json");

const symbols1 = [
    "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "GOOG", "META", "AVGO", "TSLA", "BRK.B",
    "JPM", "LLY", "V", "WMT", "XOM", "UNH", "MA", "ORCL", "COST", "JNJ",
    "HD", "PG", "NFLX", "ABBV", "BAC", "KO", "CVX", "CRM", "AMD", "MRK",
    "PEP", "TMO", "CSCO", "LIN", "ADBE", "WFC", "ACN", "MCD", "ABT", "IBM",
    "GE", "DIS", "PM", "QCOM", "TXN", "INTU", "CAT", "VZ", "AMGN", "ISRG"
];

const symbols2 = [
    "NOW", "GS", "DHR", "PFE", "CMCSA", "SPGI", "AXP", "RTX", "MS", "T",
    "UBER", "NEE", "LOW", "HON", "UNP", "PGR", "BKNG", "BLK", "SYK", "COP",
    "ETN", "ELV", "TJX", "LMT", "C", "VRTX", "BSX", "PLD", "SCHW", "REGN",
    "MDT", "ADP", "CB", "MMC", "BX", "PANW", "ADI", "KLAC", "LRCX", "NKE",
    "SBUX", "DE", "MU", "AMAT", "GILD", "BMY", "TMUS", "INTC", "CI", "SO"
];

const symbols3 = [
    "MO", "DUK", "ICE", "CME", "ZTS", "SHW", "EQIX", "MDLZ", "CL", "APH",
    "PH", "SNPS", "CDNS", "ANET", "MCO", "TT", "WM", "CVS", "PYPL", "ITW",
    "USB", "EMR", "HCA", "AON", "CTAS", "GD", "TDG", "NOC", "MCK", "PNC",
    "ORLY", "MAR", "FDX", "CSX", "ECL", "APD", "BDX", "NSC", "MMM", "AJG",
    "SLB", "EOG", "PSX", "MPC", "VLO", "OXY", "WMB", "KMI", "OKE", "HLT"
];

const symbols4 = [
    "ROP", "AZO", "CMG", "ABNB", "CRWD", "FTNT", "SNOW", "PLTR", "SHOP", "DASH",
    "COIN", "MRVL", "WDAY", "TEAM", "DDOG", "ZS", "NET", "MDB", "XYZ", "HOOD",
    "F", "GM", "RIVN", "LCID", "NIO", "BABA", "PDD", "JD", "TSM", "ASML",
    "SONY", "TM", "SAP", "NVO", "AZN", "SHEL", "BP", "RIO", "BHP", "TTE",
    "UL", "DEO", "GSK", "HSBC", "SAN", "ING", "BUD", "SPOT", "ARM", "SMCI"
];

/*
1 call 50 symbols 1 second
Wait 2 second
1 call 50 symbols 1 second
Wait 2 second
1 call 50 symbols 1 second
Wait 2 second
1 call 50 symbols 1 second
10 second loop

6loops
*/
const OPEN_DELAY = 2000;
const CLOSED_DELAY = 60000; //
const ERROR_DELAY = 30000; //wait after failed call
const LIMIT_DELAY = 60000; //limit

let running = false;

function marketIsOpen() {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23"
    }).formatToParts(new Date());
    const get = type => parts.find(p => p.type === type).value;
    const day = get("weekday");
    const minutes = Number(get("hour")) * 60 + Number(get("minute"));
    return day !== "Sat" && day !== "Sun" && minutes >= 570 && minutes < 960;
}

function fetchSymbols(symbols) {
    const url = "https://data.alpaca.markets/v2/stocks/snapshots"
        + "?symbols=" + symbols.join(",")
        + "&feed=iex";
 
    return fetch(url, {
        headers: {
            "APCA-API-KEY-ID": env.alpaca_key,
            "APCA-API-SECRET-KEY": env.alpaca_secret
        }
    }).then(res => {
        if (!res.ok) {
            return { status: res.status, rows: [] };
        }
        return res.json().then(data => {
            const rows = [];
            for (const ticker of symbols) {
                const snap = data[ticker];
                if (snap && snap.latestTrade) {
                    rows.push({
                        ticker: ticker,
                        price: snap.latestTrade.p,
                        prevClose: snap.prevDailyBar ? snap.prevDailyBar.c : null
                    });
                }
            }
            return { status: res.status, rows: rows };
        });
    });
}

function savePrices(rows) {
    if (rows.length === 0) {
        return Promise.resolve();
    }
    return pool.query(
        `INSERT INTO stock_prices (ticker, price, prev_close, updated_at)
         SELECT t, p, c, NOW()
         FROM unnest($1::varchar[], $2::numeric[], $3::numeric[]) AS u(t, p, c)
         ON CONFLICT (ticker) DO UPDATE
         SET price = EXCLUDED.price,
             prev_close = EXCLUDED.prev_close,
             updated_at = EXCLUDED.updated_at`,
        [rows.map(r => r.ticker), rows.map(r => r.price), rows.map(r => r.prevClose)]
    );
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function updateSymbols(symbols) {
    try {
        const result = await fetchSymbols(symbols);
        if (result.status === 429) {
            console.log("Price updater: rate limited, slowing down");
            return LIMIT_DELAY;
        }
        if (result.status !== 200) {
            console.log("Price updater: Alpaca returned status", result.status);
            return ERROR_DELAY;
        }
        await savePrices(result.rows);
        console.log(`Price updater: saved ${result.rows.length} prices (${symbols[0]}...)`);
        return marketIsOpen() ? OPEN_DELAY : CLOSED_DELAY;
    } catch (error) {
        console.log("Price updater error:", error.message);
        return ERROR_DELAY;
    }
}

async function startPriceUpdater() {
    if (running) return;
    running = true;
    while (true) {
        await sleep(await updateSymbols(symbols1));
        await sleep(await updateSymbols(symbols2));
        await sleep(await updateSymbols(symbols3));
        const delay = await updateSymbols(symbols4);
        if (delay !== OPEN_DELAY) {
            await sleep(delay);
        }
    }
}
 
module.exports = { startPriceUpdater, marketIsOpen };