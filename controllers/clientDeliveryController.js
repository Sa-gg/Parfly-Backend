import * as deliveryService from "../services/clientDeliveryServices.js";

export const createClientDelivery = async (req, res) => {
  try {
    const deliveryData = req.body;
    const newDelivery = await deliveryService.createClientDelivery(deliveryData);
    res.status(201).json(newDelivery);
  } catch (error) {
    console.error("Error creating client delivery", error);
    res.status(500).json({ message: "Failed to create delivery", error: error.message });
  }
};

export const getClientDeliveries = async (req, res) => {
  try {
    const userId = req.params.userId;
    const deliveries = await deliveryService.getClientDeliveries(userId);
    res.status(200).json(deliveries);
  } catch (error) {
    console.error("Error fetching client deliveries:", error);
    res.status(500).json({ message: "Failed to fetch deliveries", error: error.message });
  }
};
