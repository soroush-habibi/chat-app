export default class generate {
    private static resource = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    static chatId(): string {
        const resourceLength = this.resource.length;
        let result: string = "";
        for (let i = 0; i < 16; i++) {
            result += this.resource.charAt(Math.floor(Math.random() * resourceLength));
        }
        return result;
    }

    static filename(ext: string): string {
        const resourceLength = this.resource.length;
        let result: string = "";
        for (let i = 0; i < 8; i++) {
            result += this.resource.charAt(Math.floor(Math.random() * resourceLength));
        }
        return result + "." + ext;
    }
}