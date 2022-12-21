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

    static async invitePV(username: string, targetUser: string, pkey: string): Promise<null | string> {
        if (targetUser == null || pkey == null || typeof targetUser !== 'string' || typeof pkey !== 'string' || targetUser.length < 6) {
            throw new Error("invalid input");
        }

        if (username == targetUser) {
            throw new Error("you can not invite yourself");
        }

        const target = await this.client.db("chatApp").collection("users").findOne({ username: targetUser });

        const pendingInvite = await this.client.db("chatApp").collection("chats").findOne({ receiver: targetUser, users: { $elemMatch: { username: username } } });

        const pendingInvite2 = await this.client.db("chatApp").collection("chats").findOne({ receiver: username, users: { $elemMatch: { username: targetUser } } });

        const chat = await this.client.db("chatApp").collection("chats").findOne({ $and: [{ users: { $elemMatch: { username: username } } }, { users: { $elemMatch: { username: targetUser } } }] });

        log(pendingInvite, pendingInvite2, chat);

        if (!target) {
            throw new Error("can not find target user");
        } else if (pendingInvite) {
            throw new Error("invite pending");
        } else if (pendingInvite2) {
            //todo this part should accept invite instead of throwing error
            throw new Error("you should accept this user invite");
        } else if (chat) {
            throw new Error("you are already in chat with this user");
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
                return chatId;
            } else {
                throw new Error("inserting failed");
            }
        }
    }

    static async acceptInvitePV(username: string, chatId: string, pkey: string): Promise<null | boolean> {
        if (chatId == null || pkey == null || typeof chatId !== 'string' || typeof pkey !== "string" || chatId.length !== 16) {
            throw new Error("invalid input");
        }

        log(chatId, username)
        const chat = await this.client.db("chatApp").collection("chats").findOne({ chat_id: chatId, receiver: username });

        if (!chat) {
            throw new Error("can not find invite");
        } else {
            const result = await this.client.db("chatApp").collection("chats").updateOne({ chat_id: chatId, receiver: username }, {
                $unset: {
                    receiver: ""
                },
                $push: {
                    users: {
                        username: username,
                        pkey: pkey
                    }
                }
            });

            if (result.acknowledged && result.modifiedCount === 1) {
                return true;
            } else {
                throw new Error("updating document failed");
            }
        }
    }
}