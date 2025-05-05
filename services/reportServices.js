import { query } from "../db.js";

export const getTransactions = async () => {
  const { rows } = await query("SELECT * FROM users WHERE role = 'customer'");

  return rows;
};
