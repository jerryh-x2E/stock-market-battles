const { checkLogin, signUp, getUserId } = require("../services/userService.js");
const { insertToken, deleteSession } = require("../services/authService.js");
const crypto = require("crypto");

const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "strict"
};

function logIn(req, res) {
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({ msg: "Please enter a username and a password" });
    }
    checkLogin(req.body.username, req.body.password).then(result => {
        if (result) {
            const token = crypto.randomBytes(32).toString("hex");
            getUserId(req.body.username).then(
                userId => insertToken(token, userId)
            ).then(success => {
                if (success) {
                    res.cookie("token", token, cookieOptions).send();
                } else {
                    res.status(500).json({ msg: "An unexpected error occurred. Please try again." });
                }
            });
        } else {
            res.status(401).send();
        }
    }).catch(error => {
        res.status(500).send();
    });
}

function logOut(req, res) {
    const { token } = req.cookies;
    if (token === undefined) {
        return res.status(200).send();
    }
    deleteSession(token).then(() => {
        res.clearCookie("token", cookieOptions).send();
    });
}

function register(req, res) {
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({ msg: "Please enter a username and a password" });
    }
    signUp(req.body.username, req.body.password).then(result => {
        res.status(result.code).json({ msg: result.msg });
    }).catch(error => {
        res.status(500).json({ msg: "Something went wrong" });       
    });
}

module.exports = { logIn, logOut, register }