const pv = io("/pv");
const gp = io("/gp");

const form = document.querySelector("form");
const logOutBtn = document.getElementById("log-out");
const invitesUl = document.getElementById("invites");
let acceptBtn;
let declineBtn;

form.addEventListener('submit', async (e) => {
    e.preventDefault();
});

logOutBtn.addEventListener('click', async (e) => {
    const response = await axios.get("/api/log-out");
    const data = await response.data;
    if (data.success === true) {
        window.location = "/";
    }
});

document.addEventListener("DOMContentLoaded", async (e) => {
    const invites = await getInvitesPV();

    for (let i of invites) {
        invitesUl.appendChild(i);
    }

    acceptBtn = document.querySelectorAll(".accept");
    declineBtn = document.querySelectorAll(".decline");

    for (let i of acceptBtn) {
        i.addEventListener('click', async (e) => {
            const response = await axios.put("api/accept-invite-pv", { chatId: e.currentTarget.parentNode.parentNode.dataset.chatId, pkey: "test" });
            const data = await response.data;
            console.log(data);
        });
    }

    for (let i of declineBtn) {
        i.addEventListener('click', async (e) => {
            const response = await axios.delete(`api/decline-invite-pv/${encodeURIComponent(e.currentTarget.parentNode.parentNode.dataset.chatId)}`);
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
        li.dataset.chatId = i.chat_id;
        li.innerHTML = i.users[0].username;
        li.innerHTML += `<div>
        <i class="fas fa-check accept"></i>
        <i class="fas fa-ban decline"></i>
    </div>`;
        result.push(li);
    }

    return result;
}