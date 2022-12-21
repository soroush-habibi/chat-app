import express from 'express';
import apiController from '../controllers/apiController.js';
import viewsController from '../controllers/viewsController.js';
const router = express.Router();
router.get('/login', apiController.login);
router.post('/register', apiController.register);
router.post("/invitePV", viewsController.authorization, apiController.invitePV);
export default router;
