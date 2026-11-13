const express = require("express");
const {logIn, logOut, register} = require("../controllers/userController");
const userRouter = express.Router();

router.post("/api/users", register);
router.post("/api/sessions", logIn);
router.delete("/api/sessions", logOut);

module.exports = userRouter;