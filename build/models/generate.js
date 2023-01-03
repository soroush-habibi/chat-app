export default class generate {
    static chatId() {
        const resourceLength = this.resource.length;
        let result = "";
        for (let i = 0; i < 16; i++) {
            result += this.resource.charAt(Math.floor(Math.random() * resourceLength));
        }
        return result;
    }
    static filename(ext) {
        const resourceLength = this.resource.length;
        let result = "";
        for (let i = 0; i < 8; i++) {
            result += this.resource.charAt(Math.floor(Math.random() * resourceLength));
        }
        return result + "." + ext;
    }
}
generate.resource = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
