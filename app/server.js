const express = require("express");
const { Pool } = require("pg");
const env = require("../env.json");

const hostname = "localhost";
const port = 3000;

const app = express();
app.use(express.json());
app.use(express.static("public"));

const pool = new Pool(env.db_config);

pool.connect().then(() => {
    console.log("Connected to database");
});

app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`);
});