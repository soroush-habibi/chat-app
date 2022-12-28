const socket = io();

socket.on("invite", async (sender, chatId) => {
    addInvite(sender, chatId);
});

socket.on("acceptInvite", (chatId) => {
    const chat = document.querySelector("#chats").querySelector(`#${chatId}`);
    if (chat) {
        chat.classList.remove("pending");
        chat.classList.add("active");
        chat.innerHTML = chat.innerHTML.slice(0, chat.innerHTML.indexOf("(Pending Invite)"));
    }
});

socket.on("declineInvite", (chatId) => {
    const chat = document.querySelector("#chats").querySelector(`#${chatId}`);
    console.log(chat);
    if (chat) {
        chat.remove();
    }
});

const chatForm = document.getElementById("chat-form");
const inviteForm = document.getElementById("invite-form");
const inviteFormInput = document.getElementById("invite-form-input");
const logOutBtn = document.getElementById("log-out");
const invitesUl = document.getElementById("invites");
const chatsDiv = document.getElementById("chats");
let acceptBtn;
let declineBtn;
let currentUsername;

let activeChat = null;

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
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
            localStorage.setItem(data.body.chat_id, data.body.privateKey);
            addChat(username, data.body.chat_id, true);
            socket.emit("join", [data.body.chat_id]);
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
                    localStorage.setItem(data.body.chat_id, data.body.privateKey);
                    removeInvite(target.parentNode.parentNode.id);
                    addChat(target.parentNode.parentNode.innerHTML.split("<div>")[0], target.parentNode.parentNode.id, false);
                    socket.emit("join", [target.parentNode.parentNode.id]);
                    socket.emit("acceptInvite", target.parentNode.parentNode.id)
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
            localStorage.setItem(data.body.chat_id, data.body.privateKey);
            removeInvite(target.parentNode.parentNode.id);
            addChat(target.parentNode.parentNode.innerHTML.split("<div>")[0], target.parentNode.parentNode.id, false);
            socket.emit("join", [target.parentNode.parentNode.id]);
            socket.emit("acceptInvite", target.parentNode.parentNode.id);
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