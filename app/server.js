const express = require("express");
const cookieParser = require("cookie-parser");
const env = require("../env.json");

const userRouter = require("./routes/userRouter.js");
const { startPriceUpdater } = require("./services/priceUpdater.js");

const hostname = "localhost";
const port = 3000;

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.static("public"));

app.use(userRouter);

app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`);
    startPriceUpdater(); 
});