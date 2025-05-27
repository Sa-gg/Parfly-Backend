import express from 'express';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser); // <-- add this line

export default router;
