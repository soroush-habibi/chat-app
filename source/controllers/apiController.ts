import express from 'express';
import JWT from 'jsonwebtoken';

import fs from 'fs';
import path from 'path';

import DB from "../models/mongo.js";

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
}