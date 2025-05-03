import * as deliveryService from "../services/deliveryServices.js";

export const getDeliveries = async (req, res) => {
  try {
    const deliveries = await deliveryService.getDeliveries();
    res.status(200).json(deliveries);
  } catch (error) {
    console.error("Error fetching deliveries", error);
    res.status(500).json({ message: error.message });
  }
};

export const createDelivery = async (req, res) => {
  try {
    const deliveryData = req.body;
    const deliveries = await deliveryService.createDelivery(deliveryData);
    res.status(200).json(deliveries);
  } catch (error) {
    console.error("Error creating delivery", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateDelivery = async (req, res) => {
  try {
    const deliveryData = req.body;
    const deliveryId = req.params.id;
    const updatedDelivery = await deliveryService.updateDelivery(
      deliveryData,
      deliveryId
    );

    if (!updatedDelivery) {
      res.status(404).json({ message: "Delivery not found" });
      return;
    }
    res.status(200).json(updatedDelivery);
  } catch (error) {
    console.error("Error updating delivery", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteDelivery = async (req, res) => {
  try {
    const deliveryId = req.params.id;
    const deletedDelivery = await deliveryService.deleteDelivery(deliveryId);
    if (!deletedDelivery) {
      res.status(404).json({ message: "Delivery not found" });
      return;
    }
    res.status(200).send();
  } catch (error) {
    console.error("Error deleting delivery", error);
    res.status(500).json({ message: error.message });
  }
};

export const searchDeliveries = async (req, res) => {
  try {
    const searchTerm = req.query.q;
    const deliveries = await deliveryService.searchDeliveries(searchTerm);
    res.status(200).json(deliveries);
  } catch (error) {
    console.error("Error searching deliveries", error);
    res.status(500).json({ message: error.message });
  }
}
