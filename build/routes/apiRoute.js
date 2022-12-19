import express from 'express';
import apiController from '../controllers/apiController.js';
const router = express.Router();
router.get('/login', apiController.login);
router.post('/register', apiController.register);
export default router;
