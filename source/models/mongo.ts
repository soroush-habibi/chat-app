import mongodb from 'mongodb';
import bcrypt from 'bcrypt';

import generate from './generate.js';

const log = console.log;

export default class DB {
    private static client: mongodb.MongoClient;
    static async connect(func: (x: mongodb.MongoClient) => void): Promise<void> {
        if (process.env.MONGODB_URL) {
            this.client = await mongodb.MongoClient.connect(process.env.MONGODB_URL);
            func(this.client);
        } else {
            throw new Error("MongoDB connection string is not exist in environment variables");
        }
    }

    static async login(username: any, password: any): Promise<null | mongodb.ObjectId> {
        if (username == null || password == null || typeof username !== 'string' || typeof password !== 'string' || username.length < 6 || password.length < 8) {
            throw new Error("invalid input");
        }

        const user = await this.client.db("chatApp").collection("users").findOne({ username: username });

        if (!user) {
            throw new Error("can not find user");
        } else if (bcrypt.compareSync(password, user.password)) {
            return user._id;
        } else {
            throw new Error("wrong password");
        }
    }

    static async register(username: string, password: string): Promise<null | mongodb.ObjectId> {
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
        } else {
            throw new Error("inserting failed");
        }
    }

    static async invitePV(username: string, password: string, targetUser: string, pkey: string): Promise<null | mongodb.ObjectId> {
        if (targetUser == null || pkey == null || typeof targetUser !== 'string' || typeof pkey !== 'string' || targetUser.length < 6) {
            throw new Error("invalid input");
        }

        await DB.login(username, password).catch(e => {
            throw new Error(e.message);
        });

        const target = await this.client.db("chatApp").collection("users").findOne({ username: targetUser });

        if (!target) {
            throw new Error("can not find target user");
        } else {
            let chatId: string;
            do {
                chatId = generate.chatId();
            } while (await this.client.db("chatApp").collection("chats").findOne({ chat_id: chatId }));
            const result = await this.client.db("chatApp").collection("chats").insertOne({
                chat_id: chatId,
                users: [
                    {
                        username: username,
                        pkey: pkey
                    }
                ],
                receiver: targetUser
            });
            if (result.acknowledged) {
                return result.insertedId;
            } else {
                throw new Error("inserting failed");
            }
        }
    }
}