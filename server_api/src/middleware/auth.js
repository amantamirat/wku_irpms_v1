const jwt = require("jsonwebtoken");
require('dotenv').config();

// Middleware to authenticate the token (basic verification)
const authenticateToken = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1]; // Get token from Authorization header
    if (!token) return res.status(403).json({ message: "Unauthorized" });
    try {
        const decoded = jwt.verify(token, process.env.KEY); // Verify the token
        req.user = decoded; // Attach user info to request object
        next(); // Proceed to next middleware/route handler
    } catch (error) {
        return res.status(403).json({ message: "Invalid token, Logout and Login Again Please" });
    }
};



module.exports = { authenticateToken};
