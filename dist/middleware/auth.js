import { verifyAccessToken } from "../utils/jwt.js";
export function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const token = authHeader.slice(7);
    try {
        const payload = verifyAccessToken(token);
        req.auth = { userId: payload.userId, email: payload.email };
        next();
    }
    catch {
        res.status(401).json({ message: "Unauthorized" });
    }
}
