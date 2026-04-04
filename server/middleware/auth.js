import * as jwt from "jose";

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET);

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization token required" });
    }

    const { payload } = await jwt.jwtVerify(
      authHeader.substring(7),
      getSecret(),
    );
    req.userId = payload.userId;
    next();
  } catch (error) {
    const msg = error.code === "JWT_EXPIRED" ? "Token expired" : "Invalid token";
    return res.status(401).json({ error: msg });
  }
};
