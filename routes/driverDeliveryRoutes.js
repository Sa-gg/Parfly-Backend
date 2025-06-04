import express from "express";
import * as driverDeliveryController from "../controllers/driverDeliveryController.js";

const router = express.Router();

router.get("/driver/deliveries-by-distance", driverDeliveryController.getDeliveriesByDistance);
router.get("/driver/delivery/:deliveryId/distance", driverDeliveryController.getDeliveryDistanceForOne);


export default router;
