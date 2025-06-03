import { query } from "../db.js";

export const createClientDelivery = async (deliveryData) => {
  const {
    sender_id,
    pickup_address,
    dropoff_address,
    payer = "sender",
    add_info,
    pickup_lat,
    pickup_long,
    dropoff_lat,
    dropoff_long,
    parcel_amount,
    receiver_name,
    receiver_contact,

    // Newly added fields
    delivery_fee = 0,
    commission_amount = 0,
    driver_earnings = 0,
    commission_deducted = false,
    additional_compensation = 0,
    tip = 0,
    distance_km = 0,
    duration_minutes = 0,

    // NEW: City fields
    pickup_city = null,
    dropoff_city = null,
  } = deliveryData;

  const senderResult = await query(`SELECT full_name FROM users WHERE user_id = $1`, [sender_id]);
  const sender_name = senderResult.rows[0]?.full_name || null;

  const { rows } = await query(
    `
    INSERT INTO public.deliveries (
      sender_id, pickup_address, dropoff_address, payer,
      add_info, pickup_lat, pickup_long, dropoff_lat, dropoff_long,
      parcel_amount, sender_name, receiver_name, receiver_contact,
      delivery_fee, commission_amount, driver_earnings, commission_deducted,
      additional_compensation, tip,
      distance_km, duration_minutes,
      pickup_city, dropoff_city,
      status, created_at
    ) VALUES (
      $1, $2, $3, $4,
      $5, $6, $7, $8, $9,
      $10, $11, $12, $13,
      $14, $15, $16, $17,
      $18, $19,
      $20, $21,
      $22, $23,
      'pending', NOW()
    )
    RETURNING *;
    `,
    [
      sender_id,
      pickup_address,
      dropoff_address,
      payer,
      add_info,
      pickup_lat,
      pickup_long,
      dropoff_lat,
      dropoff_long,
      parcel_amount,
      sender_name,
      receiver_name,
      receiver_contact,
      delivery_fee,
      commission_amount,
      driver_earnings,
      commission_deducted,
      additional_compensation,
      tip,
      distance_km,
      duration_minutes,
      pickup_city,
      dropoff_city,
    ]
  );

  return rows[0];
};


export const getClientDeliveries = async (userId) => {
  const { rows } = await query(
    `
    SELECT *
    FROM deliveries
    WHERE sender_id = $1
    ORDER BY created_at DESC;
    `,
    [userId]
  );
  return rows;
};

export const getClientDeliveryById = async (deliveryId, senderId) => {
  const { rows } = await query(
    `
    SELECT *
    FROM deliveries
    WHERE delivery_id = $1 AND sender_id = $2;
    `,
    [deliveryId, senderId]
  );

  return rows[0]; // return a single delivery
};

export const updateClientDelivery = async (deliveryId, updateData) => {
  const {
    driver_id,
    status,
    delivery_fee,
    commission_amount,
    driver_earnings,
    commission_deducted,
    additional_compensation,
    tip,
    parcel_amount,
    receiver_name,
    receiver_contact,
    dropoff_address,
    dropoff_lat,
    dropoff_long,
    dropoff_city,
    distance_km,
    duration_minutes,
    add_info,
    accepted_at,
    received_at,
  } = updateData;

  const fields = [];
  const values = [];
  let paramIndex = 1;

  const addField = (key, value) => {
    fields.push(`${key} = $${paramIndex++}`);
    values.push(value);
  };

  if (driver_id !== undefined) addField("driver_id", driver_id);
  if (status !== undefined) addField("status", status);
  if (delivery_fee !== undefined) addField("delivery_fee", delivery_fee);
  if (commission_amount !== undefined) addField("commission_amount", commission_amount);
  if (driver_earnings !== undefined) addField("driver_earnings", driver_earnings);
  if (commission_deducted !== undefined) addField("commission_deducted", commission_deducted);
  if (additional_compensation !== undefined) addField("additional_compensation", additional_compensation);
  if (tip !== undefined) addField("tip", tip);
  if (parcel_amount !== undefined) addField("parcel_amount", parcel_amount);
  if (receiver_name !== undefined) addField("receiver_name", receiver_name);
  if (receiver_contact !== undefined) addField("receiver_contact", receiver_contact);
  if (dropoff_address !== undefined) addField("dropoff_address", dropoff_address);
  if (dropoff_lat !== undefined) addField("dropoff_lat", dropoff_lat);
  if (dropoff_long !== undefined) addField("dropoff_long", dropoff_long);
  if (dropoff_city !== undefined) addField("dropoff_city", dropoff_city);
  if (distance_km !== undefined) addField("distance_km", distance_km);
  if (duration_minutes !== undefined) addField("duration_minutes", duration_minutes);
  if (add_info !== undefined) addField("add_info", add_info);
  if (accepted_at !== undefined) addField("accepted_at", accepted_at);
  if (received_at !== undefined) addField("received_at", received_at);

  if (fields.length === 0) {
    throw new Error("No valid fields provided for update.");
  }

  const queryText = `
    UPDATE deliveries
    SET ${fields.join(", ")}
    WHERE delivery_id = $${paramIndex}
    RETURNING *;
  `;

  values.push(deliveryId);

  const { rows } = await query(queryText, values);
  return rows[0];
};

