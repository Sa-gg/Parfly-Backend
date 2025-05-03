import express from 'express';

import * as deliveryController from '../controllers/deliveryController.js';

const router = express.Router();

router.get('/deliveries', deliveryController.getDeliveries);
router.post('/deliveries', deliveryController.createDelivery);
router.put('/deliveries/:id', deliveryController.updateDelivery);
router.delete('/deliveries/:id', deliveryController.deleteDelivery);
router.get('/deliveries/search', deliveryController.searchDeliveries);

export default router;