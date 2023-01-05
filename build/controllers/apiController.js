import JWT from 'jsonwebtoken';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import DB from "../models/mongo.js";
import generate from '../models/generate.js';
const log = console.log;
export default class controller {
    static login(req, res) {
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
                    const token = JWT.sign({ username: req.query.username, password: req.query.password }, fs.readFileSync(path.join(process.env.ROOT, "private.key")), { expiresIn: 604800000, algorithm: "RS256" });
                    res.cookie("JWT", token, { expires: new Date(Date.now() + 604800000), httpOnly: true });
                    res.status(200).json({
                        success: true,
                        body: userId,
                        message: "OK"
                    });
                }
                else {
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
    static register(req, res) {
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
    static logOut(req, res) {
        res.clearCookie("JWT");
        res.status(200).json({
            success: true,
            body: null,
            message: "OK"
        });
    }
    static invitePV(req, res) {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem',
            },
            privateKeyEncoding: {
                type: 'pkcs1',
                format: 'pem',
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
                res.status(200).json({
                    success: true,
                    body: { chat_id: chatId, privateKey, publicKey },
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
    static acceptInvitePV(req, res) {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem',
            },
            privateKeyEncoding: {
                type: 'pkcs1',
                format: 'pem',
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
                res.status(200).json({
                    success: true,
                    body: { chat_id: req.body.chatId, privateKey, publicKey },
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
    static declineInvitePV(req, res) {
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
    static getInvitesReceived(req, res) {
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
    static getChats(req, res) {
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
    static currentUsername(req, res) {
        res.status(200).json({
            success: true,
            body: res.locals.username,
            message: "OK"
        });
    }
    static sendMessage(req, res) {
        if (req.body.chatId) {
            DB.connect(async (client) => {
                const result = await DB.sendMessage(res.locals.username, req.body.chatId, req.body.message).catch(e => {
                    res.status(400).json({
                        success: false,
                        body: null,
                        message: e.message
                    });
                });
                if (result) {
                    res.status(200).json({
                        success: true,
                        body: result,
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
        else {
            try {
                const form = formidable({
                    allowEmptyFiles: false,
                    keepExtensions: true,
                    multiples: false,
                    maxFileSize: 1000 * 1024 * 1024
                });
                form.parse(req, async (err, fields, files) => {
                    if (err) {
                        throw new Error("fail to parse file");
                    }
                    else {
                        const realFilename = files[''].originalFilename;
                        const filepath = files[''].filepath;
                        let ext = filepath.split(".");
                        ext = ext[ext.length - 1];
                        let savedFilename;
                        if (process.env.ROOT) {
                            do {
                                savedFilename = generate.filename(ext);
                            } while (fs.existsSync(path.join(process.env.ROOT, "/uploads", fields.chatId, savedFilename)));
                            DB.connect(async (client) => {
                                const result = await DB.sendFile(res.locals.username, fields.chatId, realFilename, savedFilename, files[''].size).catch(e => {
                                    res.status(400).json({
                                        success: false,
                                        body: null,
                                        message: e.message
                                    });
                                });
                                if (result) {
                                    if (process.env.ROOT) {
                                        fs.copyFileSync(filepath, path.join(process.env.ROOT, "/uploads", fields.chatId, savedFilename));
                                    }
                                    else {
                                        res.status(500).json({
                                            success: false,
                                            body: null,
                                            message: "ROOT does not exist in environment variables"
                                        });
                                    }
                                    res.status(200).json({
                                        success: true,
                                        body: result,
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
                        else {
                            res.status(500).json({
                                success: false,
                                body: null,
                                message: "ROOT does not exist in environment variables"
                            });
                        }
                    }
                });
            }
            catch (e) {
                res.status(500).json({
                    success: false,
                    body: null,
                    message: e.message
                });
            }
        }
    }
    static getMessages(req, res) {
        if (!req.query.chatId) {
            res.status(400).json({
                success: false,
                query: null,
                message: "invalid input"
            });
            return;
        }
        DB.connect(async (client) => {
            const result = await DB.getMessages(res.locals.username, req.query.chatId).catch(e => {
                res.status(400).json({
                    success: false,
                    body: null,
                    message: e.message
                });
            });
            if (result) {
                res.status(200).json({
                    success: true,
                    body: result,
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
    static getPublicKey(req, res) {
        if (!req.query.targetUser || !req.query.chatId) {
            res.status(400).json({
                success: false,
                query: null,
                message: "invalid input"
            });
            return;
        }
        DB.connect(async (client) => {
            const result = await DB.getPublicKey(res.locals.username, req.query.targetUser, req.query.chatId).catch(e => {
                res.status(400).json({
                    success: false,
                    body: null,
                    message: e.message
                });
            });
            if (result) {
                res.status(200).json({
                    success: true,
                    body: result.replace(/\n/g, ''),
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
    static downloadFile(req, res) {
        DB.connect(async (client) => {
            const result = await DB.existsChat(res.locals.username, req.params.chatId).catch(e => {
                res.status(400).json({
                    success: false,
                    body: null,
                    message: e.message
                });
            });
            if (process.env.ROOT) {
                if (result && fs.existsSync(path.join(process.env.ROOT, "/uploads", req.params.chatId, req.params.filename))) {
                    res.status(200).download(path.join(process.env.ROOT, "/uploads", req.params.chatId, req.params.filename));
                }
                else {
                    res.status(404).json({
                        success: false,
                        body: null,
                        message: "can not find file"
                    });
                }
            }
            else {
                res.status(500).json({
                    success: false,
                    body: null,
                    message: "ROOT does not exist in environment variables"
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
}
