const { Pool } = require("pg");
const env = require("../env.json");

const pool = new Pool(env.db_config);
pool.connect().then(() => {
    console.log("Connected to database");
});

module.exports = pool;