import { query } from "../db.js";

// FETCH Deliveries (no joins needed anymore, just from deliveries table)
export const getDeliveries = async () => {
  const { rows } = await query(`
    SELECT * 
    FROM deliveries 
    ORDER BY created_at DESC
  `);
  return rows;
};

export const createDelivery = async (deliveryData) => {
  const {
    sender_id,
    receiver_id,
    driver_id,
    pickup_address,
    dropoff_address,
    status,
    payer,
    add_info,
    pickup_lat,
    pickup_long,
    dropoff_lat,
    dropoff_long,
    parcel_amount,
    accepted_at,
    received_at,
    delivery_fee = 0,
    commission_deducted = false,
  } = deliveryData;

  // Fetch sender, receiver, driver details first
  const senderResult = await query(
    `SELECT full_name FROM users WHERE user_id = $1`,
    [sender_id]
  );
  const receiverResult = await query(
    `SELECT full_name FROM users WHERE user_id = $1`,
    [receiver_id]
  );
  const driverResult = await query(
    `
    SELECT u.full_name AS driver_name, d.vehicle_type, d.vehicle_plate
    FROM drivers d
    JOIN users u ON d.user_id = u.user_id
    WHERE d.driver_id = $1
  `,
    [driver_id]
  );

  const sender_name = senderResult.rows[0]?.full_name || null;
  const receiver_name = receiverResult.rows[0]?.full_name || null;
  const driver_name = driverResult.rows[0]?.driver_name || null;
  const vehicle = driverResult.rows[0]?.vehicle_type || null;
  const vehicle_plate = driverResult.rows[0]?.vehicle_plate || null;

  const commissionRate = 0.2; // 20%

  const { rows } = await query(
    `
      INSERT INTO public.deliveries (
        sender_id, receiver_id, driver_id,
        pickup_address, dropoff_address, status,
        created_at, payer, add_info,
        pickup_lat, pickup_long, dropoff_lat, dropoff_long,
        parcel_amount, accepted_at, received_at,
        sender_name, receiver_name, driver_name, vehicle, vehicle_plate,
        delivery_fee, commission_amount, driver_earnings, commission_deducted
      ) VALUES (
        $1, $2, $3,
        $4, $5, $6,
        NOW(), $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15,
        $16, $17, $18, $19, $20,
        $21, 
        ROUND($21 * $22)::integer, 
        ROUND($21 - ($21 * $22))::integer,
        $23
      )
      RETURNING *;
    `,
    [
      sender_id,
      receiver_id,
      driver_id,
      pickup_address,
      dropoff_address,
      status,
      payer,
      add_info,
      pickup_lat,
      pickup_long,
      dropoff_lat,
      dropoff_long,
      parcel_amount,
      accepted_at || null,
      received_at || null,
      sender_name,
      receiver_name,
      driver_name,
      vehicle,
      vehicle_plate,
      delivery_fee,
      commissionRate,
      commission_deducted,
    ]
  );

  return rows[0];
};

export const updateDelivery = async (deliveryData, deliveryId) => {
  const {
    sender_id,
    receiver_id,
    driver_id,
    pickup_address,
    dropoff_address,
    status,
    payer,
    add_info,
    pickup_lat,
    pickup_long,
    dropoff_lat,
    dropoff_long,
    parcel_amount,
    accepted_at,
    received_at,
  } = deliveryData;

  let sender_name = null;
  let receiver_name = null;
  let driver_name = null;
  let vehicle = null;
  let vehicle_plate = null;

  // Fetch updated sender/receiver/driver details ONLY if ID is provided
  if (sender_id) {
    const senderResult = await query(
      `SELECT full_name FROM users WHERE user_id = $1`,
      [sender_id]
    );
    sender_name = senderResult.rows[0]?.full_name || null;
  }
  if (receiver_id) {
    const receiverResult = await query(
      `SELECT full_name FROM users WHERE user_id = $1`,
      [receiver_id]
    );
    receiver_name = receiverResult.rows[0]?.full_name || null;
  }
  if (driver_id) {
    const driverResult = await query(
      `
      SELECT u.full_name AS driver_name, d.vehicle_type, d.vehicle_plate
      FROM drivers d
      JOIN users u ON d.user_id = u.user_id
      WHERE d.driver_id = $1
    `,
      [driver_id]
    );
    driver_name = driverResult.rows[0]?.driver_name || null;
    vehicle = driverResult.rows[0]?.vehicle_type || null;
    vehicle_plate = driverResult.rows[0]?.vehicle_plate || null;
  }

  const { rows } = await query(
    `
      UPDATE public.deliveries SET
        sender_id = $1,
        receiver_id = $2,
        driver_id = $3,
        pickup_address = $4,
        dropoff_address = $5,
        status = $6,
        payer = $7,
        add_info = $8,
        pickup_lat = $9,
        pickup_long = $10,
        dropoff_lat = $11,
        dropoff_long = $12,
        parcel_amount = $13,
        accepted_at = $14,
        received_at = $15,
        sender_name = COALESCE($16, sender_name),
        receiver_name = COALESCE($17, receiver_name),
        driver_name = COALESCE($18, driver_name),
        vehicle = COALESCE($19, vehicle),
        vehicle_plate = COALESCE($20, vehicle_plate)
      WHERE delivery_id = $21
      RETURNING *;
    `,
    [
      sender_id,
      receiver_id,
      driver_id,
      pickup_address,
      dropoff_address,
      status,
      payer,
      add_info,
      pickup_lat,
      pickup_long,
      dropoff_lat,
      dropoff_long,
      parcel_amount,
      accepted_at || null,
      received_at || null,
      sender_name,
      receiver_name,
      driver_name,
      vehicle,
      vehicle_plate,
      deliveryId,
    ]
  );

  return rows[0];
};

// DELETE Delivery (no changes needed)
export const deleteDelivery = async (deliveryId) => {
  const { rowCount } = await query(
    `
      DELETE FROM public.deliveries
      WHERE delivery_id = $1
      RETURNING *;
    `,
    [deliveryId]
  );

  return rowCount > 0;
};

// SEARCH Deliveries (no joins needed anymore)
export const searchDeliveries = async (searchTerm) => {
  const { rows } = await query(
    `
    SELECT * 
    FROM deliveries 
    WHERE 
      CAST(delivery_id AS TEXT) ILIKE $1 OR
      sender_name ILIKE $1 OR
      receiver_name ILIKE $1 OR
      driver_name ILIKE $1 OR
      vehicle ILIKE $1 OR
      pickup_address ILIKE $1 OR
      dropoff_address ILIKE $1 OR
      status ILIKE $1
    ORDER BY created_at DESC
    `,
    [`%${searchTerm}%`]
  );

  return rows;
};
