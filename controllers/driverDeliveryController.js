import * as deliveryService from "../services/driverDeliveryServices.js";

export const getDeliveriesByDistance = async (req, res) => {
  const { lat, lon } = req.query;

  try {
    const categorized = await deliveryService.getDeliveriesByDistance(lat, lon);
    res.json(categorized);
  } catch (error) {
    console.error("Error getting deliveries by distance:", error.message);
    res.status(500).json({ error: error.message });
  }
};


export const getDeliveryDistanceForOne = async (req, res) => {
  const { lat, lon } = req.query;
  const { deliveryId } = req.params;

  try {
    const result = await deliveryService.getDeliveryDistanceById(lat, lon, deliveryId);
    res.json(result);
  } catch (error) {
    console.error(`Error getting delivery distance for ID ${deliveryId}:`, error.message);
    res.status(500).json({ error: error.message });
  }
};
