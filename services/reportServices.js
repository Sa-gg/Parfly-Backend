import { query } from "../db.js";

export const getTransactions = async ({
  status = null,
  startDate = "2000-01-01",
  endDate = "2999-12-31",
} = {}) => {
  const sql = `
  WITH completed_delivery_data AS (
  SELECT
    (created_at AT TIME ZONE 'Asia/Manila')::date AS delivery_date,
    COUNT(*) AS completed_deliveries
  FROM deliveries
  WHERE status = 'completed'
    AND (created_at AT TIME ZONE 'Asia/Manila')::date BETWEEN $1::date AND $2::date
  GROUP BY (created_at AT TIME ZONE 'Asia/Manila')::date
),
delivery_counts AS (
  SELECT
    (created_at AT TIME ZONE 'Asia/Manila')::date AS delivery_date,
    status,
    driver_id,
    COUNT(*) AS driver_delivery_count
  FROM deliveries
  WHERE ($3::text[] IS NULL OR status = ANY($3))
    AND (created_at AT TIME ZONE 'Asia/Manila')::date BETWEEN $1::date AND $2::date
  GROUP BY (created_at AT TIME ZONE 'Asia/Manila')::date, status, driver_id
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
  (d.created_at AT TIME ZONE 'Asia/Manila')::date AS delivery_date,
  d.status,
  COUNT(d.delivery_id) AS total_deliveries,
  COUNT(DISTINCT d.driver_id) AS unique_drivers,
  ROUND(COUNT(d.delivery_id)::decimal / NULLIF(COUNT(DISTINCT d.driver_id), 0), 2) AS avg_deliveries_per_driver,
  COUNT(DISTINCT d.sender_id) AS unique_senders,
  ROUND(COUNT(d.delivery_id)::decimal / NULLIF(COUNT(DISTINCT d.sender_id), 0), 2) AS avg_deliveries_per_sender,
  COUNT(DISTINCT d.receiver_id) AS unique_receivers,
  ROUND(COUNT(d.delivery_id)::decimal / NULLIF(COUNT(DISTINCT d.receiver_id), 0), 2) AS avg_deliveries_per_receiver,
  ROUND(s.std_deliveries_per_driver, 2) AS std_deliveries_per_driver,
  c.completed_deliveries
FROM deliveries d
LEFT JOIN std_dev_calc s
  ON s.delivery_date = (d.created_at AT TIME ZONE 'Asia/Manila')::date
  AND s.status = d.status
LEFT JOIN completed_delivery_data c
  ON c.delivery_date = (d.created_at AT TIME ZONE 'Asia/Manila')::date
WHERE ($3::text[] IS NULL OR d.status = ANY($3))
  AND (d.created_at AT TIME ZONE 'Asia/Manila')::date BETWEEN $1::date AND $2::date
GROUP BY (d.created_at AT TIME ZONE 'Asia/Manila')::date, d.status, s.std_deliveries_per_driver, c.completed_deliveries
ORDER BY (d.created_at AT TIME ZONE 'Asia/Manila')::date, d.status;

`;

  const hasStatusFilter = Array.isArray(status) && status.length > 0;
  const { rows } = await query(sql, [
    startDate,
    endDate,
    hasStatusFilter ? status : null,
  ]);
  return rows;
};

export const getDeliveryStatus = async () => {
  const { rows } = await query("");
  return rows;
};
