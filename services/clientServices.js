import bcrypt from 'bcrypt';
import { query } from "../db.js";

const SALT_ROUNDS = 10;

export const getClients = async () => {
  const { rows } = await query("SELECT * FROM users WHERE role = 'customer'");
  return rows;
};

export const createClient = async (clientData) => {
  const { full_name, email, password_hash, phone, role = 'customer' } = clientData;

  // 🔒 Hash the password
  const hashedPassword = await bcrypt.hash(password_hash, SALT_ROUNDS);

  const { rows } = await query(
    "INSERT INTO users (full_name, email, password_hash, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [full_name, email, hashedPassword, phone, role]
  );
  return rows[0];
};

export const updateClient = async (clientData, clientId) => {
  const { full_name, email, password_hash, phone, role = 'customer' } = clientData;

  let queryText;
  let values;

  if (password_hash) {
    // 🔒 Hash the new password
    const hashedPassword = await bcrypt.hash(password_hash, SALT_ROUNDS);

    queryText = `
      UPDATE users
      SET full_name = $1, email = $2, password_hash = $3, phone = $4, role = $5
      WHERE user_id = $6
      RETURNING *;
    `;
    values = [full_name, email, hashedPassword, phone, role, clientId];
  } else {
    queryText = `
      UPDATE users
      SET full_name = $1, email = $2, phone = $3, role = $4
      WHERE user_id = $5
      RETURNING *;
    `;
    values = [full_name, email, phone, role, clientId];
  }

  const { rows } = await query(queryText, values);
  return rows[0];
};

export const deleteClient = async (clientId) => {
  const { rowCount } = await query("DELETE FROM users WHERE user_id = $1", [clientId]);
  return rowCount > 0; 
};


export const searchClients = async (searchTerm) => {
  const { rows } = await query(
    `SELECT * FROM users WHERE full_name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1`,
    [`%${searchTerm}%`]
  );
  return rows;
}

