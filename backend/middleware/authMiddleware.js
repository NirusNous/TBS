const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes
const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith(
        "Bearer"
        )
    ) {
        token = req.headers.authorization.split(" ")[1];

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select("-password");

            if (!user) {
                return res.status(401).json({ message: "User not found, authorization denied" });
            }

            req.user = user;
            return next();
        } catch (error) {
            return res.status(401).json({ message: "Invalid token" });
        }
    }
    if (!token) {
        return res.status(401).json({ message: "No auth token, authorization denied" });
    }
};


module.exports = { protect };
