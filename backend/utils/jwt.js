const jwt = require("jsonwebtoken");

const SECRET  = process.env.JWT_SECRET;
const EXPIRES = process.env.JWT_EXPIRES_IN || "8h";

const generateToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: EXPIRES });

const verifyToken = (token) => jwt.verify(token, SECRET);

module.exports = { generateToken, verifyToken };
