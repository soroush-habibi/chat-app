import express from 'express';

import viewsController from '../controllers/viewsController.js';

const router = express.Router();

router.get("/", viewsController.authorization, viewsController.homePage);

router.get("/chat", viewsController.chatPage);

export default router;