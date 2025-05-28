import express from 'express';
import * as clientDeliveryController from '../controllers/clientDeliveryController.js';

const router = express.Router();

router.post('/client/deliveries', clientDeliveryController.createClientDelivery);

export default router;
