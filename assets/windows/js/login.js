const ipc = require('electron').ipcRenderer;

console.log = function(x) {
    ipc.send('log', x);
};

let timeoutAction;

ipc.on('accountCreation', (e, d) => {
    if (d == 'failed') {
        clearTimeout(timeoutAction);
        $("#creatingAccount").css('display', 'none');
        $("#caFail").css('display', 'none');
        $("#caExists").css('display', 'block');
    }
})

ipc.on('login', (e, d) => {
    clearTimeout(timeoutAction);
    $("#creatingAccount").css('display', 'none');
    $("#loggingIn").css('display', 'none');
    $("#caFail").css('display', 'none');
    $("#caFail").css('display', 'none');
    $("#lFail").css('display', 'none');
    $("#loggingIn").css('display', 'none');
    $("#lFail").css('display', 'none');
    $("#creatingAccount").css('display', 'none');
    $("#loginInfo").css('display', 'block');
    $('#loginButton').css('display', 'none');
    $('#createAccount').css('display', 'none');
    $("#login").css('display', 'none');
    $("#username").text(gS("user"));
    checkLoginToken();
})

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

const checkLoginToken = (a) => {
    if (gS("loginToken") != undefined) {
        $("#caFail").css('display', 'none');
        $("#lFail").css('display', 'none');
        $("#loggingIn").css('display', 'none');
        $("#lFail").css('display', 'none');
        $("#creatingAccount").css('display', 'none');
        $("#loginInfo").css('display', 'block');
        $('#loginButton').css('display', 'none');
        $('#createAccount').css('display', 'none');
        $("#login").css('display', 'none');
        $("#username").text(gS("user"));
    } else if (a == 'login') {
        $("#loggingIn").css('display', 'none');
        $("#lFail").css('display', 'block');
    } else if (a == 'create') {
        $("#creatingAccount").css('display', 'none');
        $("#caFail").css('display', 'block');
    }
};

ipc.on("login", () => {
    $("#loginInfo").css('display', 'block');
    $("#login").css('display', 'none');
    $("#username").text(gS("user"));
});

const {
    remote
} = require('electron');

document.getElementById('close').addEventListener('click', () => {
    remote.getCurrentWindow().close();
});

document.getElementById('minimize').addEventListener('click', () => {
    remote.getCurrentWindow().minimize();
});

checkLoginToken();

$('#createAccount').click(() => {
    $("#caFail").css('display', 'none');
    $("#lFail").css('display', 'none');
    $('#email').css('display', 'block');
    $('#create').css('display', 'block');
    $("#login").css('display', 'none');
});

$('#loginButton').click(() => {
    $("#caFail").css('display', 'none');
    $("#lFail").css('display', 'none');
    $('#email').css('display', 'none');
    $('#create').css('display', 'none');
    $("#login").css('display', 'block');
});

$('#logout').click(() => {
    $("#loginInfo").css('display', 'none');
    $("#login").css('display', 'block');
    ipc.send("logout", gS("loginToken"));
    $('#loginButton').css('display', 'block');
    $('#createAccount').css('display', 'block');
    localStorage.removeItem("user");
    localStorage.removeItem("loginToken");
});


$('#login').click(() => {
    let user = $('#user').val();
    let pass = $('#pass').val();
    var modal = document.getElementById('id01');
    modal.style.display = "none";
    if (user != undefined) ipc.send('login', {
        user: user,
        password: pass
    });
    sS("user", user);
    $("#loggingIn").css('display', 'block');
    timeoutAction = setTimeout(() => {
        checkLoginToken("login");
    }, 30000);
});

$('#create').click(() => {
    let user = $('#user').val();
    let email = $('#email').val();
    let pass = $('#pass').val();
    var modal = document.getElementById('id01');
    modal.style.display = "none";
    if (user != undefined) ipc.send('createAccount', {
        user: user,
        email: email,
        password: pass
    });
    sS("user", user);
    $("#creatingAccount").css('display', 'block');
    timeoutAction = setTimeout(() => {
        checkLoginToken("create");
    }, 30000);
});