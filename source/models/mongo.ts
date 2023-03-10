import mongodb from 'mongodb';
import bcrypt from 'bcrypt';

import fs from 'fs';
import path from 'path';

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
                messages: [],
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
                if (process.env.ROOT) {
                    fs.mkdirSync(path.join(process.env.ROOT, "/uploads", chatId));
                }
                return true;
            } else {
                throw new Error("updating document failed");
            }
        }
    }

    static async declineInvitePV(username: string, chatId: any): Promise<null | boolean> {
        if (chatId == null || typeof chatId !== 'string' || chatId.length !== 16) {
            throw new Error("invalid input");
        }

        const chat = await this.client.db("chatApp").collection("chats").findOne({ chat_id: chatId, receiver: username });

        if (!chat) {
            throw new Error("can not find invite");
        } else {
            const result = await this.client.db("chatApp").collection("chats").deleteOne({ chat_id: chatId, receiver: username });

            if (result.acknowledged && result.deletedCount === 1) {
                return true;
            } else {
                throw new Error("deleting document failed");
            }
        }
    }

    static async existsChat(username: string, chatId: any): Promise<boolean> {
        if (chatId == null || typeof chatId !== 'string' || chatId.length !== 16) {
            throw new Error("invalid input");
        }

        const chat = await this.client.db("chatApp").collection("chats").findOne({ chat_id: chatId, users: { $elemMatch: { username: username } } });

        if (chat) {
            return true;
        } else {
            return false;
        }
    }

    static async getInvitesReceived(username: string): Promise<object[]> {
        const invites = await this.client.db("chatApp").collection("chats").find({ receiver: username }).project({ _id: 0, messages: 0, receiver: 0 }).toArray();
        return invites;
    }

    static async getChats(username: string): Promise<object[]> {
        const chats = await this.client.db("chatApp").collection("chats").find({ users: { $elemMatch: { username: username } } }).project({ _id: 0, messages: 0 }).toArray();
        return chats;
    }

    static async sendMessage(username: string, chatId: string, message: string) {
        if (!message || typeof message !== 'string'! || !chatId || typeof chatId !== 'string' || chatId.length !== 16) {
            throw new Error("invalid input");
        }

        const exists = await this.client.db("chatApp").collection("chats").findOne({ chat_id: chatId, users: { $elemMatch: { username: username } } });

        if (!exists) {
            throw new Error("chat doesn't exists");
        }

        const index: number = exists.messages.length;

        const time = new Date();
        const result = await this.client.db("chatApp").collection("chats").updateOne({ chat_id: chatId, users: { $elemMatch: { username: username } } }, {
            $push: {
                messages: {
                    sender: username,
                    time: time,
                    message: message,
                    file: false,
                    index: index
                }
            }
        });

        if (result.acknowledged && result.modifiedCount === 1) {
            return {
                sender: username,
                time: time,
                message: message,
                file: false,
                index: index
            };
        } else {
            throw new Error("updating document failed");
        }
    }

    static async sendFile(username: string, chatId: string, realFilename: string, savedFilename: string, size: string) {
        if (!realFilename || typeof realFilename !== 'string'! || !chatId || typeof chatId !== 'string' || chatId.length !== 16 || !savedFilename
            || typeof savedFilename !== 'string' || !size || typeof size !== 'number') {
            throw new Error("invalid input");
        }

        const exists = await this.client.db("chatApp").collection("chats").findOne({ chat_id: chatId, users: { $elemMatch: { username: username } } });

        if (!exists) {
            throw new Error("chat doesn't exists");
        }

        const index: number = exists.messages.length;

        const time = new Date();
        const result = await this.client.db("chatApp").collection("chats").updateOne({ chat_id: chatId, users: { $elemMatch: { username: username } } }, {
            $push: {
                messages: {
                    sender: username,
                    time: time,
                    message: { realFilename, savedFilename },
                    index: index
                }
            }
        });

        if (result.acknowledged && result.modifiedCount === 1) {
            return {
                sender: username,
                time: time,
                message: { realFilename, savedFilename },
                index: index
            };
        } else {
            throw new Error("updating document failed");
        }
    }

    static async getMessages(username: string, chatId: any): Promise<null | object> {
        if (!chatId || typeof chatId !== 'string' || chatId.length !== 16) {
            throw new Error("invalid input");
        }

        const exists = await this.client.db("chatApp").collection("chats").findOne({ chat_id: chatId, users: { $elemMatch: { username: username } } });

        if (!exists) {
            throw new Error("chat doesn't exists");
        }

        const messages = await this.client.db("chatApp").collection("chats").find({ chat_id: chatId, users: { $elemMatch: { username: username } } }).project({ _id: 0, messages: 1 }).toArray();
        return messages;
    }

    static async getPublicKey(username: string, targetUser: any, chatId: any): Promise<null | string> {
        if (!chatId || typeof chatId !== 'string' || chatId.length !== 16 || !targetUser || typeof targetUser !== 'string' || targetUser.length < 6 || username === targetUser) {
            throw new Error("invalid input");
        }

        const exists = await this.client.db("chatApp").collection("chats").findOne({ chat_id: chatId, users: { $elemMatch: { username: username } } });

        if (exists) {
            const pubKey = exists.users.filter((value: any) => {
                if (value.username === targetUser) {
                    return true;
                }
            });
            if (!pubKey.length) {
                throw new Error("chat doesn't exists");
            }
            return pubKey[0].pkey;
        } else {
            throw new Error("chat doesn't exists");
        }
    }
}