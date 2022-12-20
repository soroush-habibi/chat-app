import mongodb from 'mongodb';
import bcrypt from 'bcrypt';
const log = console.log;
export default class DB {
    static async connect(func) {
        if (process.env.MONGODB_URL) {
            this.client = await mongodb.MongoClient.connect(process.env.MONGODB_URL);
            func(this.client);
        }
        else {
            throw new Error("MongoDB connection string is not exist in environment variables");
        }
    }
    static async login(username, password) {
        if (username == null || password == null || typeof username !== 'string' || typeof password !== 'string' || username.length < 6 || password.length < 8) {
            throw new Error("invalid input");
        }
        const user = await this.client.db("chatApp").collection("users").findOne({ username: username });
        if (!user) {
            throw new Error("can not find user");
        }
        else if (bcrypt.compareSync(password, user.password)) {
            return user._id;
        }
        else {
            throw new Error("wrong password");
        }
    }
    static async register(username, password) {
        if (username == null || password == null || typeof username !== 'string' || typeof password !== 'string' || username.length < 6 || password.length < 8) {
            throw new Error("invalid input");
        }
        const user = await this.client.db("chatApp").collection("users").findOne({ username: username });
        if (user) {
            throw new Error("user exists");
        }
        const result = await this.client.db("chatApp").collection("users").insertOne({
            username,
            password: bcrypt.hashSync(password, 10),
            status: "",
            chats: [],
            created_at: new Date(),
            admin: false
        });
        if (result.acknowledged) {
            return result.insertedId;
        }
        else {
            throw new Error("inserting failed");
        }
    }
}
