const { getSessionUser } = require("../services/authService.js");

function authMiddleware(req, res, next) {
    const { token } = req.cookies;
    if (token === undefined) {
        return res.status(403).json({ msg: "Unauthorized" });
    }
    getSessionUser(token).then(userId => {
        req.sessionUser = userId;
        next();
    }).catch(error => {
        return res.status(403).json({ msg: "Unauthorized" });
    });
}

module.exports = authMiddleware;