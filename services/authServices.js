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
    vehicle_type,
    vehicle_plate,
    driver_license_number, // ✅ add this
  } = userData;

  if (!email || !password || !phone) {
    throw new Error("Missing required fields");
  }

  if (!validRoles.includes(role)) {
    throw new Error("Invalid role");
  }

  const emailExists = await query("SELECT 1 FROM users WHERE email = $1", [email]);
  if (emailExists.rows.length > 0) throw new Error("Email already registered");

  const phoneExists = await query("SELECT 1 FROM users WHERE phone = $1", [phone]);
  if (phoneExists.rows.length > 0) throw new Error("Phone number already registered");

  const password_hash = await bcrypt.hash(password, 10);

  const userResult = await query(
    `INSERT INTO users (full_name, email, password_hash, phone, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING user_id, full_name, email, phone, role, created_at`,
    [full_name, email, password_hash, phone, role]
  );

  const newUser = userResult.rows[0];

  if (role === "driver") {
    if (!vehicle_type || !vehicle_plate) {
      throw new Error("Missing vehicle_type or vehicle_plate for driver");
    }

    const driverResult = await query(
      `INSERT INTO drivers (user_id, vehicle_type, vehicle_plate, driver_license_number, is_available)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING vehicle_type, vehicle_plate, driver_license_number, is_available`,
      [newUser.user_id, vehicle_type, vehicle_plate, driver_license_number || null, false]
    );

    return {
      ...newUser,
      ...driverResult.rows[0],
    };
  }

  return newUser;
};


export const loginUser = async (identifier, password) => {
  if (!identifier || !password) {
    throw new Error("Email/Phone and password are required");
  }

  let result = await query("SELECT * FROM users WHERE email = $1", [identifier]);

  if (result.rows.length === 0) {
    let normalizedPhone = identifier;

    if (/^\+639\d{9}$/.test(identifier)) {
      normalizedPhone = "0" + identifier.slice(3);
    } else if (/^639\d{9}$/.test(identifier)) {
      normalizedPhone = "0" + identifier.slice(2);
    } else if (/^9\d{9}$/.test(identifier)) {
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

  if (user.role === "driver") {
    const driverResult = await query(
      `SELECT driver_id, vehicle_type, vehicle_plate, driver_license_number is_available 
       FROM drivers 
       WHERE user_id = $1`,
      [user.user_id]
    );

    if (driverResult.rows.length > 0) {
      return {
        ...user,
        ...driverResult.rows[0], // includes driver_id
      };
    }
  }

  return user;
};

