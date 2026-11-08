const users = require("../services/userService.js");

function logIn(req, res) {
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({ msg: "Please enter a username and a password" });
    }
    users.checkLogin(req.body.username, req.body.password).then(result => {
        if (result) {
            // Session ID/JWT code ?
            res.status(200).send();
        } else {
            res.status(401).send();
        }
    }).catch(error => {
        res.status(500).send();
    })
}

function register(req, res) {
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({ msg: "Please enter a username and a password" });
    }
    users.signUp(req.body.username, req.body.password).then(result => {
        res.status(result.code).json({ msg: result.msg });
    }).catch(error => {
        res.status(500).json({ msg: "Something went wrong" });       
    });
}

module.exports = { logIn, register }