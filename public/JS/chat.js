const socket = io();

const chatForm = document.getElementById("chat-form");
const inviteForm = document.getElementById("invite-form");
const inviteFormInput = document.getElementById("invite-form-input");
const logOutBtn = document.getElementById("log-out");
const chatFormSubmitBtn = document.getElementById("send-button");
const invitesUl = document.getElementById("invites");
const chatsDiv = document.getElementById("chats");
const loadingText = document.getElementById("loading-text");
const messagesDiv = document.querySelector(".chat-messages");
const chatInput = document.getElementById("msg");
const fileInput = document.getElementById("file-input");
let acceptBtn;
let declineBtn;
let currentUsername;
let loading = false;
let currentChat = null;
let currentKey = null;

socket.on("invite", async (sender, chatId) => {
    addInvite(sender, chatId);
});

socket.on("accept", (chatId) => {
    const chat = document.querySelector("#chats").querySelector(`#${chatId}`);
    if (chat) {
        chat.classList.remove("pending");
        chat.classList.add("active");
        chat.innerHTML = chat.innerHTML.slice(0, chat.innerHTML.indexOf("(Pending Invite)"));
        addEventToChats();
        socket.emit("join", [chatId]);
    }
});

socket.on("decline", (chatId) => {
    const chat = document.querySelector("#chats").querySelector(`#${chatId}`);
    if (chat) {
        chat.remove();
    }
});

socket.on("send", (chatId, data) => {
    if (currentChat == chatId) {
        const message = document.createElement("div");
        message.classList.add("message");
        if (data.message.realFilename) {
            message.innerHTML = `<p class="meta">${data.sender} <span>${data.time}</span></p>
            <p class="text"><a href="api/messages/file/${currentChat}/${data.message.savedFilename}">
                ${data.message.realFilename}
            </a></p>`;
            message.style.backgroundColor = "#ffa45e";
        } else {
            const decrypt = new JSEncrypt();
            decrypt.setPrivateKey(JSON.parse(localStorage.getItem(chatId)).privateKey.replace(/\n/g, ''));
            data.message = decrypt.decrypt(data.message);
            message.innerHTML = `<p class="meta">${data.sender} <span>${data.time}</span></p>
                                <p class="text">
                                    ${data.message}
                                </p>`;
            if (data.sender === currentUsername) {
                message.style.backgroundColor = "#89FF8F";
            }
        }
        messagesDiv.appendChild(message);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
});

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentChat) {
        alert("You must open a chat");
    } else if (fileInput.files.length === 1) {
        loading = true;
        chatFormSubmitBtn.classList.add("d-none");
        try {
            const formData = new FormData();
            formData.append("", fileInput.files[0]);
            formData.append("chatId", currentChat);
            const response = await axios.post('api/messages', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            const data = await response.data;

            const message = document.createElement("div");
            message.classList.add("message");
            message.innerHTML = `<p class="meta">${data.body.sender} <span>${data.body.time}</span></p>
            <p class="text"><a href="api/messages/file/${currentChat}/${data.body.message.savedFilename}">
                ${data.body.message.realFilename}
            </p>`;
            message.style.backgroundColor = "#ffa45e";
            messagesDiv.appendChild(message);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
            socket.emit("sendMessage", currentChat, data.body);
            chatInput.value = "";
            fileInput.value = "";
            localStorage.setItem(`${currentChat}?${data.body.index}`, JSON.stringify({
                realFilename: data.body.message.realFilename,
                savedFilename: data.body.message.savedFilename
            }));
        } catch (e) {
            alert(e.response.data.message)
        }

        loading = false;
        chatFormSubmitBtn.classList.remove("d-none");

    } else {
        loading = true;
        chatFormSubmitBtn.classList.add("d-none");
        try {
            const inputValue = chatInput.value;
            const encrypt = new JSEncrypt();
            encrypt.setPublicKey(currentKey);
            const response = await axios.post("api/messages", { chatId: currentChat, message: encrypt.encrypt(inputValue) });
            const data = await response.data;

            const message = document.createElement("div");
            message.classList.add("message");
            message.innerHTML = `<p class="meta">${data.body.sender} <span>${data.body.time}</span></p>
    <p class="text">
        ${inputValue}
    </p>`;
            if (data.body.sender === currentUsername) {
                message.style.backgroundColor = "#89FF8F";
            }
            messagesDiv.appendChild(message);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
            socket.emit("sendMessage", currentChat, data.body);
            chatInput.value = "";
            localStorage.setItem(`${currentChat}?${data.body.index}`, inputValue);
        } catch (e) {
            alert(e.response.data.message);
        }
        loading = false;
        chatFormSubmitBtn.classList.remove("d-none");
    }
});

inviteForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = inviteFormInput.value;
    try {
        const response = await axios.post("api/invite-pv", { targetUser: username });
        const data = await response.data;
        if (!data.success) {
            alert(data.message);
        } else {
            localStorage.setItem(data.body.chat_id, JSON.stringify({ privateKey: data.body.privateKey, publicKey: data.body.publicKey }));
            addChat(username, data.body.chat_id, true);
            socket.emit("join", [data.body.chat_id]);
            socket.emit("invite", currentUsername, username, data.body.chat_id);
        }
    } catch (e) {
        alert(e.response.data.message);
    }
});

logOutBtn.addEventListener('click', async (e) => {
    const response = await axios.get("/api/log-out");
    const data = await response.data;
    if (data.success === true) {
        window.location = "/";
    }
});

document.addEventListener("DOMContentLoaded", (e) => {
    socket.on("connect", async () => {
        try {
            const response = await axios.get("api/username");
            const data = await response.data;
            currentUsername = data.body;
            socket.emit("join", [await currentUsername]);
        } catch (e) {
            alert(e);
            location.reload();
        }
        const invites = await getInvitesPV();
        const chats = await getChats(currentUsername);

        socket.emit("join", chats.map((value) => {
            return value.id;
        }));

        for (let i of invites) {
            invitesUl.appendChild(i);
        }

        for (let i of chats) {
            chatsDiv.appendChild(i);
        }

        addEventToChats();

        //* garbage collector for local storage
        for (let i = 0; i < localStorage.length; i++) {
            let check = false;
            for (let j of chats) {
                if (localStorage.key(i).startsWith(j.id)) {
                    check = true;
                }
            }
            if (!check) {
                localStorage.removeItem(localStorage.key(i));
            }
        }

        acceptBtn = document.querySelectorAll(".accept");
        declineBtn = document.querySelectorAll(".decline");

        for (let i of acceptBtn) {
            i.addEventListener('click', async (e) => {
                const target = e.currentTarget;
                const response = await axios.put("api/accept-invite-pv", { chatId: target.parentNode.parentNode.id });
                const data = await response.data;
                if (!data.success) {
                    console.log(data.message);
                } else {
                    localStorage.setItem(data.body.chat_id, JSON.stringify({ privateKey: data.body.privateKey, publicKey: data.body.publicKey }));
                    removeInvite(target.parentNode.parentNode.id);
                    addChat(target.parentNode.parentNode.innerHTML.split("<div>")[0], target.parentNode.parentNode.id, false);
                    socket.emit("join", [target.parentNode.parentNode.id]);
                    socket.emit("acceptInvite", target.parentNode.parentNode.id)
                    addEventToChats();
                }
            });
        }

        for (let i of declineBtn) {
            i.addEventListener('click', async (e) => {
                const target = e.currentTarget;
                const response = await axios.delete(`api/decline-invite-pv/${encodeURIComponent(target.parentNode.parentNode.id)}`);
                const data = await response.data;
                if (!data.success) {
                    console.log(data.message);
                } else {
                    socket.emit("declineInvite", target.parentNode.parentNode.id);
                    removeInvite(target.parentNode.parentNode.id);
                }
            });
        }
    });
});

function addInvite(username, chatId) {
    const li = document.createElement("li");
    li.id = chatId;
    li.innerHTML = username;
    li.innerHTML += `<div>
    <i class="fas fa-check accept"></i>
    <i class="fas fa-ban decline"></i>
</div>`;
    invitesUl.appendChild(li);

    invitesUl.querySelector(`#${chatId}`).querySelector(".accept").addEventListener('click', async (e) => {
        const target = e.currentTarget;
        const response = await axios.put("api/accept-invite-pv", { chatId: target.parentNode.parentNode.id });
        const data = await response.data;
        if (!data.success) {
            console.log(data.message);
        } else {
            localStorage.setItem(data.body.chat_id, JSON.stringify({ privateKey: data.body.privateKey, publicKey: data.body.publicKey }));
            removeInvite(target.parentNode.parentNode.id);
            addChat(target.parentNode.parentNode.innerHTML.split("<div>")[0], target.parentNode.parentNode.id, false);
            socket.emit("join", [target.parentNode.parentNode.id]);
            socket.emit("acceptInvite", target.parentNode.parentNode.id);
            addEventToChats();
        }
    });

    invitesUl.querySelector(`#${chatId}`).querySelector(".decline").addEventListener('click', async (e) => {
        const target = e.currentTarget;
        const response = await axios.delete(`api/decline-invite-pv/${encodeURIComponent(target.parentNode.parentNode.id)}`);
        const data = await response.data;
        if (!data.success) {
            console.log(data.message);
        } else {
            socket.emit("declineInvite", target.parentNode.parentNode.id);
            removeInvite(target.parentNode.parentNode.id);
        }
    });
}

function removeInvite(chatId) {
    const invite = document.querySelector("ul").querySelector(`#${chatId}`);
    invite.remove();
}

async function getInvitesPV() {
    let result = [];
    const response = await axios.get("api/get-invites-received");
    const data = await response.data;

    for (let i of data.body) {
        const li = document.createElement("li");
        li.id = i.chat_id;
        li.innerHTML = i.users[0].username;
        li.innerHTML += `<div>
        <i class="fas fa-check accept"></i>
        <i class="fas fa-ban decline"></i>
    </div>`;
        result.push(li);
    }

    return result;
}

function addChat(username, chatId, pending) {
    const h2 = document.createElement("h2");
    h2.id = chatId;

    let targetUser;
    if (pending) {
        targetUser = username + "(Pending Invite)";
        h2.setAttribute('class', 'pending');
    } else {
        h2.setAttribute('class', 'active');
        targetUser = username;
    }

    h2.innerHTML = targetUser;
    chatsDiv.appendChild(h2);
}

async function getChats(username) {
    let result = [];
    const response = await axios.get("api/get-chats");
    const data = await response.data;

    for (let i of data.body) {
        const h2 = document.createElement("h2");
        h2.id = i.chat_id;

        let targetUser;
        if (i.receiver) {
            targetUser = i.receiver + "(Pending Invite)";
            h2.setAttribute('class', 'pending');
        } else {
            h2.setAttribute('class', 'active');
            for (let j of i.users) {
                if (j.username !== username) {
                    targetUser = j.username;
                }
            }
        }

        h2.innerHTML = targetUser;
        result.push(h2);
    }

    return result;
}

function addEventToChats() {
    const chats = document.querySelectorAll(".active");

    for (let i of chats) {
        i.addEventListener('click', async (e) => {
            if (!loading) {
                const target = e.currentTarget;

                i.classList.add("selected");

                messagesDiv.classList.add("d-none");
                loadingText.classList.remove("d-none");

                for (let j of chats) {
                    if (target.id !== j.id) {
                        j.classList.remove("selected");
                    }
                }

                loading = true;
                try {
                    const response = await axios.get(`api/messages?chatId=${encodeURIComponent(target.id)}`);
                    let data = await response.data;
                    data = JSON.parse(data.body);

                    const response2 = await axios.get(`api/messages/pub?targetUser=${target.innerHTML}&chatId=${target.id}`);
                    const data2 = await response2.data;

                    messagesDiv.innerHTML = "";
                    for (let i = 0; i < data[0].messages.length; i++) {
                        let link;
                        const m = data[0].messages[i];
                        const message = document.createElement("div");
                        message.classList.add("message");
                        if (localStorage.getItem(`${target.id}?${m.index}`)) {
                            try {
                                const { realFilename, savedFilename } = JSON.parse(localStorage.getItem(`${target.id}?${m.index}`))
                                m.message = realFilename;
                                message.style.backgroundColor = "#ffa45e";
                                link = `<a href="api/messages/file/${target.id}/${savedFilename}">`;
                            } catch (e) {
                                m.message = localStorage.getItem(`${target.id}?${m.index}`);
                                if (m.sender === currentUsername) {
                                    message.style.backgroundColor = "#89FF8F";
                                }
                            }
                        } else {
                            if (m.message.savedFilename) {
                                const savedFilename = m.message.savedFilename;
                                m.message = m.message.realFilename;
                                message.style.backgroundColor = "#ffa45e";
                                link = `<a href="api/messages/file/${target.id}/${savedFilename}">`;
                                console.log(link);
                            } else {
                                const decrypt = new JSEncrypt();
                                decrypt.setPrivateKey(JSON.parse(localStorage.getItem(target.id)).privateKey.replace(/\n/g, ''));
                                m.message = decrypt.decrypt(m.message);
                                if (m.sender === currentUsername) {
                                    message.style.backgroundColor = "#89FF8F";
                                }
                            }
                        }
                        message.innerHTML = `<p class="meta">${m.sender} <span>${m.time}</span></p>
                    <p class="text">${link ? link : ""}
                        ${m.message}
                    ${link ? "</a>" : ""}</p>`;
                        messagesDiv.appendChild(message);
                    }
                    loadingText.classList.add("d-none");
                    messagesDiv.classList.remove("d-none");
                    currentChat = target.id;
                    currentKey = data2.body;
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                } catch (e) {
                    currentChat = null;
                    console.log(e.message);
                }
                loading = false;
            }
        });
    }
}