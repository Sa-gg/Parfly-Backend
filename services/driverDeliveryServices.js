import axios from "axios";
import { query } from "../db.js";

const tomtomKey = process.env.TOMTOM_API_KEY;

export const getDeliveriesByDistance = async (lat, lon) => {
  if (!lat || !lon) {
    throw new Error("Driver's lat and lon are required.");
  }

  const result = await query(`
    SELECT *
    FROM deliveries
    WHERE status = 'pending'
  `);

  const deliveries = result.rows;

  const nearest = []; // 0 - 5 km
  const suburbs = []; // 5 - 15 km
  const intercity = []; // 15+ km

  for (const delivery of deliveries) {
    const { pickup_lat, pickup_long, delivery_id } = delivery;

    if (!pickup_lat || !pickup_long) continue;

    const routeUrl = `https://api.tomtom.com/routing/1/calculateRoute/${lat},${lon}:${pickup_lat},${pickup_long}/json`;

    try {
      const { data } = await axios.get(routeUrl, {
        params: {
          key: tomtomKey,
          travelMode: "motorcycle",
          routeType: "fastest",
        },
      });

      const meters = data.routes?.[0]?.summary?.lengthInMeters;
      let distanceKm;

      if (meters === undefined || meters === null || meters === 0) {
        console.warn(`Delivery ${delivery_id} - No route or zero distance`);
        distanceKm = 0.01;
      } else if (meters > 0) {
        distanceKm = +(meters / 1000).toFixed(2);
      } else {
        distanceKm = 0.01;
      }
      const enriched = { ...delivery, distanceKm };

      if (distanceKm <= 5) {
        nearest.push(enriched);
      } else if (distanceKm <= 15) {
        suburbs.push(enriched);
      } else {
        intercity.push(enriched);
      }
    } catch (err) {
      console.warn(
        `TomTom route failed for delivery ${delivery_id}:`,
        err.message
      );
    }
  }

  return {
    nearest,
    suburbs,
    intercity,
  };
};


export const getDeliveryDistanceById = async (lat, lon, deliveryId) => {
  if (!lat || !lon || !deliveryId) {
    throw new Error("Latitude, longitude, and delivery ID are required.");
  }

  const result = await query(
    `SELECT * FROM deliveries WHERE delivery_id = $1`,
    [deliveryId]
  );

  const delivery = result.rows[0];
  if (!delivery) throw new Error("Delivery not found.");

  const { pickup_lat, pickup_long } = delivery;
  if (!pickup_lat || !pickup_long) throw new Error("Invalid pickup coordinates.");

  const routeUrl = `https://api.tomtom.com/routing/1/calculateRoute/${lat},${lon}:${pickup_lat},${pickup_long}/json`;

  try {
    const { data } = await axios.get(routeUrl, {
      params: {
        key: tomtomKey,
        travelMode: "motorcycle",
        routeType: "fastest",
      },
    });

    const meters = data.routes?.[0]?.summary?.lengthInMeters || 0;
    const durationSec = data.routes?.[0]?.summary?.travelTimeInSeconds || 0;
    let distanceKm;

    if (meters === undefined || meters === null || meters === 0) {
        console.warn(`Delivery ${deliveryId} - No route or zero distance`);
        distanceKm = 0.01;
      } else if (meters > 0) {
        distanceKm = +(meters / 1000).toFixed(2);
      } else {
        distanceKm = 0.01;
      }

    return {
      delivery_id: deliveryId,
      distance_km: distanceKm,
      eta_seconds: durationSec,
    };
  } catch (err) {
    console.warn(`TomTom route failed for delivery ${deliveryId}:`, err.message);
    throw new Error("Failed to fetch route data.");
  }
};

