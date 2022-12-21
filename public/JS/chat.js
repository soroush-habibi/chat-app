const pv = io("/pv");
const gp = io("/gp");

const form = document.querySelector("form");
const logOutBtn = document.getElementById("log-out");

form.addEventListener('submit', (e) => {
    e.preventDefault();
});

logOutBtn.addEventListener('click', async (e) => {
    const response = await axios.get("/api/log-out");
    const data = await response.data;
    if (data.success === true) {
        window.location = "/";
    }
});