import { query } from "../db.js";

export const getTransactions = async ({
  status = null,
  startDate = "2000-01-01",
  endDate = "2999-12-31",
} = {}) => {
  const hasStatusFilter = Array.isArray(status) && status.length > 0;
  const sql = `
     WITH delivery_counts AS (
      SELECT
        DATE(created_at) AS delivery_date,
        status,
        driver_id,
        COUNT(*) AS driver_delivery_count
      FROM deliveries
      WHERE ($1::text[] IS NULL OR status = ANY($1))
        AND DATE(created_at) >= $2::date
        AND DATE(created_at) <= $3::date
      GROUP BY DATE(created_at), status, driver_id
    ),
    std_dev_calc AS (
      SELECT
        delivery_date,
        status,
        STDDEV_POP(driver_delivery_count) AS std_deliveries_per_driver
      FROM delivery_counts
      GROUP BY delivery_date, status
    )
    SELECT
      DATE(d.created_at) AS delivery_date,
      d.status,
      COUNT(d.delivery_id) AS total_deliveries,
      COUNT(DISTINCT d.driver_id) AS unique_drivers,
      ROUND(COUNT(d.delivery_id)::decimal / NULLIF(COUNT(DISTINCT d.driver_id), 0), 2) AS avg_deliveries_per_driver,
      COUNT(DISTINCT d.sender_id) AS unique_senders,
      ROUND(COUNT(d.delivery_id)::decimal / NULLIF(COUNT(DISTINCT d.sender_id), 0), 2) AS avg_deliveries_per_sender,
      COUNT(DISTINCT d.receiver_id) AS unique_receivers,
      ROUND(COUNT(d.delivery_id)::decimal / NULLIF(COUNT(DISTINCT d.receiver_id), 0), 2) AS avg_deliveries_per_receiver,
      ROUND(s.std_deliveries_per_driver, 2) AS std_deliveries_per_driver
    FROM deliveries d
    LEFT JOIN std_dev_calc s
      ON s.delivery_date = DATE(d.created_at)
      AND s.status = d.status
    WHERE ($1::text[] IS NULL OR d.status = ANY($1))
      AND DATE(d.created_at) >= $2::date
      AND DATE(d.created_at) <= $3::date
    GROUP BY DATE(d.created_at), d.status, s.std_deliveries_per_driver
    ORDER BY DATE(d.created_at), d.status;
  `;

  const { rows } = await query(sql, [hasStatusFilter ? status : null, startDate, endDate]);
  return rows;
};


export const getDeliveryStatus = async () => {
  const { rows } = await query("");
  return rows;
};
