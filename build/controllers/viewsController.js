export default class controller {
    static homePage(req, res) {
        res.sendFile(`${process.env.ROOT}/views/index.html`);
    }
    static chatPage(req, res) {
        res.sendFile(`${process.env.ROOT}/views/chat.html`);
    }
}
