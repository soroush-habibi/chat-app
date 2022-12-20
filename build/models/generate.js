export default class generate {
    static chatId() {
        const resource = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const resourceLength = resource.length;
        let result = "";
        for (let i = 0; i < 16; i++) {
            result += resource.charAt(Math.floor(Math.random() * resourceLength));
        }
        return result;
    }
}
