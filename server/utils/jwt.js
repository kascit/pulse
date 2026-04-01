import * as jwt from "jose";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is required");
  }
  return new TextEncoder().encode(secret);
};

export async function generateToken(userId) {
  return new jwt.SignJWT({ userId: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyToken(token) {
  const { payload } = await jwt.jwtVerify(token, getJwtSecret());
  return payload;
}
