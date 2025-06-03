import express from 'express';
import * as clientDeliveryController from '../controllers/clientDeliveryController.js';

const router = express.Router();

router.post('/client/deliveries', clientDeliveryController.createClientDelivery);
router.get('/client/deliveries/:userId', clientDeliveryController.getClientDeliveries);
router.get('/client/deliveries/:userId/:deliveryId', clientDeliveryController.getClientDeliveryById);
router.get('/driver/deliveries/:driverId', clientDeliveryController.getDriverDeliveryById);
router.patch('/client/deliveries/:deliveryId', clientDeliveryController.updateClientDelivery);

export default router;
