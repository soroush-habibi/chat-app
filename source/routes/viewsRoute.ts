import express from 'express';

import viewsController from '../controllers/viewsController.js';

const router = express.Router();

router.get("/", viewsController.tokenCheck, viewsController.homePage);

router.get("/chat", viewsController.authorization, viewsController.chatPage);

export default router;