import express from 'express';
import * as clientDeliveryController from '../controllers/clientDeliveryController.js';

const router = express.Router();

router.post('/client/deliveries', clientDeliveryController.createClientDelivery);
router.get('/client/deliveries/:userId', clientDeliveryController.getClientDeliveries);
router.get('/client/deliveries/:userId/:deliveryId', clientDeliveryController.getClientDeliveryById);


export default router;
