import express from 'express';
import * as authController from '../controllers/authController.js';

const router = express.Router();

// General
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);

// Driver-specific
router.post('/register/driver', authController.registerDriver);
router.post('/login/driver', authController.loginDriver);


// Customer-specific
router.post('/register/customer', authController.registerCustomer);
router.post('/login/customer', authController.loginCustomer);

export default router;
