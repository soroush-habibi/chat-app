import express from 'express';

export default class controller {
    static homePage(req: express.Request, res: express.Response) {
        res.sendFile(`${process.env.ROOT}/views/index.html`);
    }
    static chatPage(req: express.Request, res: express.Response) {
        res.sendFile(`${process.env.ROOT}/views/chat.html`);
    }
}