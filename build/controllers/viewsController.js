import JWT from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import DB from "../models/mongo.js";
export default class controller {
    //! if JWT is ok redirect to chat else next
    static tokenCheck(req, res, next) {
        const token = req.cookies.JWT;
        if (!token) {
            next();
            return;
        }
        if (process.env.ROOT) {
            let decoded;
            try {
                decoded = JWT.verify(token, fs.readFileSync(path.join(process.env.ROOT, "public.pem")));
            }
            catch (e) {
                next();
                return;
            }
            DB.connect(async (client) => {
                const userId = await DB.login(decoded.username, decoded.password).catch(e => {
                    res.status(400).json({
                        success: false,
                        body: null,
                        message: e.message
                    });
                });
                client.close();
                if (userId) {
                    res.redirect("/chat");
                }
                else {
                    next();
                    return;
                }
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
                message: "MongoDB connection string is not exist in environment variables"
            });
        }
    }
    //! if JWT is ok go to next
    static authorization(req, res, next) {
        const token = req.cookies.JWT;
        if (!token) {
            res.redirect("/");
            return;
        }
        if (process.env.ROOT) {
            let decoded;
            try {
                decoded = JWT.verify(token, fs.readFileSync(path.join(process.env.ROOT, "public.pem")));
            }
            catch (e) {
                res.redirect("/");
                return;
            }
            DB.connect(async (client) => {
                const userId = await DB.login(decoded.username, decoded.password).catch(e => {
                    res.status(400).json({
                        success: false,
                        body: null,
                        message: e.message
                    });
                });
                client.close();
                if (userId) {
                    res.locals.username = decoded.username;
                    res.locals.password = decoded.password;
                    next();
                }
                else {
                    res.redirect("/");
                    return;
                }
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
                message: "MongoDB connection string is not exist in environment variables"
            });
        }
    }
    static homePage(req, res) {
        res.sendFile(`${process.env.ROOT}/views/index.html`);
    }
    static chatPage(req, res) {
        res.sendFile(`${process.env.ROOT}/views/chat.html`);
    }
}
