const pv = io("/pv");
const gp = io("/gp");

const chatForm = document.getElementById("chat-form");
const inviteForm = document.getElementById("invite-form");
const inviteFormInput = document.getElementById("invite-form-input");
const logOutBtn = document.getElementById("log-out");
const invitesUl = document.getElementById("invites");
const chatsDiv = document.getElementById("chats");
let acceptBtn;
let declineBtn;
let currentUsername;

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
});

inviteForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = inviteFormInput.value;
    try {
        const response = await axios.post("api/invite-pv", { targetUser: username, pkey: "test" });
        const data = await response.data;
        if (!data.success) {
            alert(data.message);
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

document.addEventListener("DOMContentLoaded", async (e) => {
    try {
        const response = await axios.get("api/username");
        const data = await response.data;
        currentUsername = data.body;
    } catch (e) {
        alert(e);
        location.reload();
    }
    const invites = await getInvitesPV();
    const chats = await getChats(currentUsername);

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
            const response = await axios.put("api/accept-invite-pv", { chatId: e.currentTarget.parentNode.parentNode.id, pkey: "test" });
            const data = await response.data;
            console.log(data);
        });
    }

    for (let i of declineBtn) {
        i.addEventListener('click', async (e) => {
            const response = await axios.delete(`api/decline-invite-pv/${encodeURIComponent(e.currentTarget.parentNode.parentNode.id)}`);
            const data = await response.data;
            console.log(data);
        });
    }
});

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
        } else {
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