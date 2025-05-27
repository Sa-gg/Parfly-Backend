import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const generateToken = (user) => {
  const payload = {
    id: user.user_id,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };

  // No expiresIn means no expiration
  return jwt.sign(payload, JWT_SECRET);
};
