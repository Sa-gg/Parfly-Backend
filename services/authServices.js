import { query } from "../db.js";
import bcrypt from "bcrypt";

const validRoles = ["admin", "customer", "driver"];

export const registerUser = async (userData) => {
  const {
    full_name = "",
    email,
    password,
    phone,
    role = "customer",
  } = userData;

  // Required fields (excluding full_name now)
  if (!email || !password || !phone) {
    throw new Error("Missing required fields");
  }

  if (!validRoles.includes(role)) {
    throw new Error("Invalid role");
  }

  // Check if email already exists
  const emailExists = await query("SELECT 1 FROM users WHERE email = $1", [
    email,
  ]);
  if (emailExists.rows.length > 0) {
    throw new Error("Email already registered");
  }

  // Check if phone already exists
  const phoneExists = await query("SELECT 1 FROM users WHERE phone = $1", [
    phone,
  ]);
  if (phoneExists.rows.length > 0) {
    throw new Error("Phone number already registered");
  }

  // Hash password
  const saltRounds = 10;
  const password_hash = await bcrypt.hash(password, saltRounds);

  const { rows } = await query(
    `INSERT INTO users (full_name, email, password_hash, phone, role) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING user_id, full_name, email, phone, role, created_at`,
    [full_name, email, password_hash, phone, role]
  );

  return rows[0];
};

export const loginUser = async (identifier, password) => {
  if (!identifier || !password) {
    throw new Error("Email/Phone and password are required");
  }

  // Try email first
  let result = await query("SELECT * FROM users WHERE email = $1", [identifier]);

  // If not found by email, try normalized phone
  if (result.rows.length === 0) {
    let normalizedPhone = identifier;

    // +639xxxxxxxxx → 09xxxxxxxxx
    if (/^\+639\d{9}$/.test(identifier)) {
      normalizedPhone = "0" + identifier.slice(3);
    }
    // 639xxxxxxxxx → 09xxxxxxxxx
    else if (/^639\d{9}$/.test(identifier)) {
      normalizedPhone = "0" + identifier.slice(2);
    }
    // 9xxxxxxxxx → 09xxxxxxxxx
    else if (/^9\d{9}$/.test(identifier)) {
      normalizedPhone = "0" + identifier;
    }

    result = await query("SELECT * FROM users WHERE phone = $1", [normalizedPhone]);

    if (result.rows.length === 0) {
      throw new Error("Invalid email/phone or password");
    }
  }

  const user = result.rows[0];

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    throw new Error("Invalid email/phone or password");
  }

  delete user.password_hash;
  return user;
};
