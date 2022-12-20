export default class generate {
    static chatId(): string {
        const resource: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const resourceLength = resource.length;
        let result: string = "";
        for (let i = 0; i < 16; i++) {
            result += resource.charAt(Math.floor(Math.random() * resourceLength));
        }
        return result;
    }
}