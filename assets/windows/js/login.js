const ipc = require('electron').ipcRenderer;

console.log = function(x) {
    ipc.send('log', x);
};

const gS = item => {
    return localStorage.getItem(item);
};
const sS = (item, value) => {
    localStorage.setItem(item, value);
    ipc.send('settingsChange', {
        name: item,
        val: value
    });
};

ipc.on("login", (q, e) => {
    $("#loginInfo").css('display', 'block')
    $("#login").css('display', 'none')
    $("#username").text(gS("user"))
})

const {
    remote
} = require('electron');

document.getElementById('close').addEventListener('click', () => {
    remote.getCurrentWindow().close();
});

document.getElementById('minimize').addEventListener('click', () => {
    remote.getCurrentWindow().minimize();
});

$('#logout').click(() => {
    $("#loginInfo").css('display', 'none');
    $("#login").css('display', 'block');
    ipc.send("logout", gS("loginToken"));
    localStorage.removeItem("user");
    localStorage.removeItem("loginToken");
})

if (gS("loginToken") != undefined) {
    $("#loginInfo").css('display', 'block')
    $("#login").css('display', 'none')
    $("#username").text(gS("user"))
}
$('#login').click(() => {
    let user = $('#user').val();
    let pass = $('#pass').val();
    var modal = document.getElementById('id01');
    modal.style.display = "none";
    sS("user", user)
})