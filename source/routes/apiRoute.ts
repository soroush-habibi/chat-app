import express from 'express';

import apiController from '../controllers/apiController.js';

import viewsController from '../controllers/viewsController.js';

const router = express.Router();

router.get('/login', apiController.login);

router.post('/register', apiController.register);

router.get("/log-out", apiController.logOut);

router.post("/invite-pv", viewsController.authorization, apiController.invitePV);

router.put("/accept-invite-pv", viewsController.authorization, apiController.acceptInvitePV);

router.get("/get-invites-received", viewsController.authorization, apiController.getInvitesReceived);

export default router;