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
