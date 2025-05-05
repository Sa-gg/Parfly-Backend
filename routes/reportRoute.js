import express from 'express';

import * as reportController from '../controllers/reportController.js';

const router = express.Router();

router.get('/transactions', reportController.getTransactions);



export default router;
