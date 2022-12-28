import express from 'express';
import JWT from 'jsonwebtoken';

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

import DB from "../models/mongo.js";
import socketModule from '../models/socket.js';

const log = console.log;

export default class controller {
    static login(req: express.Request, res: express.Response) {
        if (!req.query.username || !req.query.password) {
            res.status(400).json({
                success: false,
                query: null,
                message: "invalid input"
            });
            return;
        }

        DB.connect(async (client) => {
            const userId = await DB.login(req.query.username, req.query.password).catch(e => {
                res.status(400).json({
                    success: false,
                    body: null,
                    message: e.message
                });
            });

            if (userId) {
                if (process.env.ROOT) {
                    const token = JWT.sign({ username: req.query.username, password: req.query.password },
                        fs.readFileSync(path.join(process.env.ROOT, "private.key")), { expiresIn: 604800000, algorithm: "RS256" });
                    res.cookie("JWT", token, { expires: new Date(Date.now() + 604800000), httpOnly: true });
                    res.status(200).json({
                        success: true,
                        body: userId,
                        message: "OK"
                    });
                } else {
                    res.status(500).json({
                        success: false,
                        body: null,
                        message: "ROOT path is not exist in environment variables"
                    });
                }
            }
            client.close();
        }).catch(e => {
            res.status(500).json({
                success: false,
                body: null,
                message: e.message
            });
        });
    }

    static register(req: express.Request, res: express.Response) {
        if (!req.body.username || !req.body.password) {
            res.status(400).json({
                success: false,
                body: null,
                message: "invalid input"
            });
            return;
        }

        DB.connect(async (client) => {
            const insertedId = await DB.register(req.body.username, req.body.password).catch(e => {
                res.status(400).json({
                    success: false,
                    body: null,
                    message: e.message
                });
            });

            if (insertedId) {
                res.status(200).json({
                    success: true,
                    body: insertedId,
                    message: "OK"
                });
            }
            client.close();
        }).catch(e => {
            res.status(500).json({
                success: false,
                body: null,
                message: e.message
            });
        });
    }

    static logOut(req: express.Request, res: express.Response) {
        res.clearCookie("JWT");
        res.status(200).json({
            success: true,
            body: null,
            message: "OK"
        });
    }

    static invitePV(req: express.Request, res: express.Response) {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 4096,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem',
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
                cipher: 'aes-256-cbc',
                passphrase: 'top secret',
            }
        });
        DB.connect(async (client) => {
            const chatId = await DB.invitePV(res.locals.username, req.body.targetUser, publicKey).catch(e => {
                res.status(400).json({
                    success: false,
                    body: null,
                    message: e.message
                });
            });

            if (chatId) {
                socketModule.joinManual([chatId]);
                socketModule.sendInvite(res.locals.username, req.body.targetUser, chatId);
                res.status(200).json({
                    success: true,
                    body: { chat_id: chatId, privateKey },
                    message: "OK"
                });
            }
            client.close();
        }).catch(e => {
            res.status(500).json({
                success: false,
                body: null,
                message: e.message
            });
        });
    }

    static acceptInvitePV(req: express.Request, res: express.Response) {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 4096,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem',
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
                cipher: 'aes-256-cbc',
                passphrase: 'top secret',
            }
        });
        DB.connect(async (client) => {
            const result = await DB.acceptInvitePV(res.locals.username, req.body.chatId, publicKey).catch(e => {
                res.status(400).json({
                    success: false,
                    body: null,
                    message: e.message
                });
            });

            if (result) {
                socketModule.joinManual([req.body.chatId]);
                res.status(200).json({
                    success: true,
                    body: { chat_id: req.body.chatId, privateKey },
                    message: "OK"
                });
            }

            client.close();
        }).catch(e => {
            res.status(500).json({
                success: false,
                body: null,
                message: e.message
            });
        });
    }

    static declineInvitePV(req: express.Request, res: express.Response) {
        DB.connect(async (client) => {
            const result = await DB.declineInvitePV(res.locals.username, req.params.chatId).catch(e => {
                res.status(400).json({
                    success: false,
                    body: null,
                    message: e.message
                });
            });

            if (result) {
                res.status(200).json({
                    success: true,
                    body: req.params.chatId,
                    message: "OK"
                });
            }

            client.close();
        }).catch(e => {
            res.status(500).json({
                success: false,
                body: null,
                message: e.message
            });
        });
    }

    static getInvitesReceived(req: express.Request, res: express.Response) {
        DB.connect(async (client) => {
            const invites = await DB.getInvitesReceived(res.locals.username).catch(e => {
                res.status(400).json({
                    success: false,
                    body: null,
                    message: e.message
                });
            });

            if (invites) {
                res.status(200).json({
                    success: true,
                    body: invites,
                    message: "OK"
                });
            }

            client.close();
        }).catch(e => {
            res.status(500).json({
                success: false,
                body: null,
                message: e.message
            });
        });
    }

    static getChats(req: express.Request, res: express.Response) {
        DB.connect(async (client) => {
            const chats = await DB.getChats(res.locals.username).catch(e => {
                res.status(400).json({
                    success: false,
                    body: null,
                    message: e.message
                });
            });

            if (chats) {
                res.status(200).json({
                    success: true,
                    body: chats,
                    message: "OK"
                });
            }

            client.close();
        }).catch(e => {
            res.status(500).json({
                success: false,
                body: null,
                message: e.message
            });
        });
    }

    static currentUsername(req: express.Request, res: express.Response) {
        res.status(200).json({
            success: true,
            body: res.locals.username,
            message: "OK"
        });
    }
}