import express from 'express';

import apiController from '../controllers/apiController.js';

import viewsController from '../controllers/viewsController.js';

const router = express.Router();

router.get('/login', apiController.login);

router.post('/register', apiController.register);

router.get("/log-out", apiController.logOut);

router.get("/username", viewsController.authorization, apiController.currentUsername);

router.post("/invite-pv", viewsController.authorization, apiController.invitePV);

router.put("/accept-invite-pv", viewsController.authorization, apiController.acceptInvitePV);

router.delete("/decline-invite-pv/:chatId", viewsController.authorization, apiController.declineInvitePV);

router.get("/get-invites-received", viewsController.authorization, apiController.getInvitesReceived);

router.get("/get-chats", viewsController.authorization, apiController.getChats);

router.get("/messages", viewsController.authorization, apiController.getMessages);

router.post("/messages", viewsController.authorization, apiController.sendMessage);

router.get("/messages/pub", viewsController.authorization, apiController.getPublicKey)

export default router;