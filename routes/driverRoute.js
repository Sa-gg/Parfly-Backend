import express from 'express';

import * as driverController from '../controllers/driverController.js';

const router = express.Router();

router.get('/drivers', driverController.getDrivers);
router.post('/drivers', driverController.createDriver);
router.put('/drivers/:id', driverController.updateDriver);
router.delete('/drivers/:id', driverController.deleteDriver);
router.get('/drivers/search', driverController.searchDrivers);


export default router;
