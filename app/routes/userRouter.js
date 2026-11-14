const express = require("express");
const {logIn, logOut, register} = require("../controllers/userController");
const userRouter = express.Router();

userRouter.post("/api/users", register);
userRouter.post("/api/sessions", logIn);
userRouter.delete("/api/sessions", logOut);

module.exports = userRouter;