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

