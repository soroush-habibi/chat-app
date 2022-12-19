import DB from "../models/mongo.js";
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
                res.status(200).json({
                    success: true,
                    body: userId,
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
}
