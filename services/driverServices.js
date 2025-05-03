import { query } from "../db.js";

export const getDrivers = async () => {
  const { rows } = await query(`
    SELECT 
      u.user_id,
      u.full_name,
      u.email,
      u.phone,
      u.role,
      u.created_at,
      d.driver_id,
      d.vehicle_type,
      d.vehicle_plate,
      d.is_available,
      ROUND(AVG(r.rating), 1) AS average_rating
    FROM users u
    INNER JOIN drivers d ON u.user_id = d.user_id
    LEFT JOIN ratings r ON d.driver_id = r.driver_id
    WHERE u.role = 'driver'
    GROUP BY u.user_id, d.driver_id
    ORDER BY u.full_name
  `);
  return rows;
};


export const createDriver = async (driverData) => {
  const {
    full_name,
    email,
    password_hash,
    phone,
    role = 'driver',
    vehicle_type,
    vehicle_plate,
    is_available = false,
  } = driverData;

  const userResult = await query(
    "INSERT INTO users (full_name, email, password_hash, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [full_name, email, password_hash, phone, role]
  );

  const user = userResult.rows[0];

  const driverResult = await query(
    "INSERT INTO drivers (user_id, vehicle_type, vehicle_plate, is_available) VALUES ($1, $2, $3, $4) RETURNING *",
    [user.user_id, vehicle_type, vehicle_plate, is_available]
  );

  return {
    ...user,
    ...driverResult.rows[0]
  };
};


export const updateDriver = async (driverData, driverId) => {
  const {
    full_name,
    email,
    password_hash,
    phone,
    role = 'driver',
    vehicle_type,
    vehicle_plate,
    is_available
  } = driverData;

  let userQuery, userValues;

  if (password_hash) {
    userQuery = `
      UPDATE users
      SET full_name = $1, email = $2, password_hash = $3, phone = $4, role = $5
      WHERE user_id = $6
      RETURNING *;
    `;
    userValues = [full_name, email, password_hash, phone, role, driverId];
  } else {
    userQuery = `
      UPDATE users
      SET full_name = $1, email = $2, phone = $3, role = $4
      WHERE user_id = $5
      RETURNING *;
    `;
    userValues = [full_name, email, phone, role, driverId];
  }

  const userResult = await query(userQuery, userValues);

  const driverResult = await query(
    `
    UPDATE drivers
    SET vehicle_type = $1, vehicle_plate = $2, is_available = $3
    WHERE user_id = $4
    RETURNING *;
    `,
    [vehicle_type, vehicle_plate, is_available, driverId]
  );

  return {
    ...userResult.rows[0],
    ...driverResult.rows[0]
  };
};


export const deleteDriver = async (driverId) => {
  const { rowCount } = await query("DELETE FROM users WHERE user_id = $1", [driverId]);
  return rowCount > 0;
};



export const searchDrivers = async (searchTerm) => {
  const { rows } = await query(`
    SELECT 
      u.user_id,
      u.full_name,
      u.email,
      u.phone,
      u.role,
      u.created_at,
      d.driver_id,
      d.vehicle_type,
      d.vehicle_plate,
      d.is_available,
      ROUND(AVG(r.rating), 1) AS average_rating
    FROM users u
    INNER JOIN drivers d ON u.user_id = d.user_id
    LEFT JOIN ratings r ON d.driver_id = r.driver_id
    WHERE u.role = 'driver'
    AND (
      u.full_name ILIKE $1
      OR u.email ILIKE $1
      OR u.phone ILIKE $1
      OR d.vehicle_type ILIKE $1
      OR d.vehicle_plate ILIKE $1

    )
    GROUP BY u.user_id, d.driver_id
    ORDER BY u.full_name
  `, [`%${searchTerm}%`]);

  return rows;
};

