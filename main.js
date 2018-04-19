const electron = require('electron');
const app = electron.app;

//Encryption and Server Conenction
var NodeRSA = require('node-rsa');
let firstBuffer = true;
var serverKey;

const key = new NodeRSA({
    b: 512
});

let msg = serverKey.encrypt({
    login: true,
    info: {
        userName: 'Test',
        email: "Test@Test.Test",
        password: "test",
        id: '12345'
    }
});

var WebSocket = require('ws');
var ws = new WebSocket('wss://login.ratchtnet.com:8484');
ws.on('open', function open() {
    ws.on('message', function incoming(message) {
        if (firstBuffer) {
            serverKey = new NodeRSA(message, 'pkcs8-public-der');
            firstBuffer = 0;
            serverKey.encrypt(JSON.stringify({
                clientKey: key.exportKey('public')
            }));
        } else {

        }
    });

});

const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;

const path = require('path');
const url = require('url');
let debug = false;
require('electron-reload')(__dirname);

let intro, settingsW, fileSave, libary;

const dialog = electron.dialog;

exports.selectDirectory = () => {
    dialog.showOpenDialog(settingsW, {
        properties: ['openDirectory']
    });
};

const createSettings = () => {
    if (settingsW != null) settingsW.focus();
    else {
        settingsW = new BrowserWindow({
            width: 300,
            height: 300,
            frame: false,
            darkTheme: true,
            transparent: true,
            autoHideMenuBar: true,
            icon: 'assets/images/256.ico'
        });
        if (debug) settingsW.webContents.openDevTools();
        settingsW.setMenu(null);
        settingsW.setResizable(false);
        settingsW.loadURL(url.format({
            pathname: path.join(__dirname, 'assets/windows/settings.html'),
            protocol: 'file:',
            slashes: true
        }));
        settingsW.on('closed', () => {
            settingsW = null;
        });
    }
};

const createFileSave = () => {
    if (fileSave != null) fileSave.focus();
    else {
        fileSave = new BrowserWindow({
            width: 300,
            height: 300,
            frame: false,
            darkTheme: true,
            transparent: true,
            autoHideMenuBar: true,
            icon: 'assets/images/256.ico'
        });
        if (debug) fileSave.webContents.openDevTools();
        fileSave.setMenu(null);
        fileSave.setResizable(false);
        fileSave.loadURL(url.format({
            pathname: path.join(__dirname, 'assets/windows/fileSave.html'),
            protocol: 'file:',
            slashes: true
        }));
        fileSave.on('closed', () => {
            fileSave = null;
        });
    }
};

const createLibary = () => {
    if (libary != null) libary.focus();
    else {
        libary = new BrowserWindow({
            width: 300,
            height: 300,
            frame: false,
            darkTheme: true,
            transparent: true,
            autoHideMenuBar: true,
            icon: 'assets/images/256.ico'
        });
        if (debug) libary.webContents.openDevTools();
        libary.setMenu(null);
        libary.setResizable(false);
        libary.loadURL(url.format({
            pathname: path.join(__dirname, 'assets/windows/libary.html'),
            protocol: 'file:',
            slashes: true
        }));
        libary.on('closed', () => {
            libary = null;
        });
    }
};

const createWindow = () => {
    intro = new BrowserWindow({
        width: 820,
        height: 550,
        frame: false,
        darkTheme: true,
        autoHideMenuBar: true,
        transparent: true,
        icon: 'assets/images/256.ico'
    });
    if (debug) intro.webContents.openDevTools();
    intro.setMenu(null);
    intro.setResizable(false);
    intro.loadURL(url.format({
        pathname: path.join(__dirname, 'assets/windows/intro.html'),
        protocol: 'file:',
        slashes: true
    }));
    intro.on('closed', function() {
        if (settingsW) settingsW.close();
        intro = null;
    });
};

ipc.on('settingsWindow', (e, a) => {
    if (a == 'open') createSettings();
});

ipc.on('fileSave', (e, a) => {
    if (a == 'open') createFileSave();
});

ipc.on('libary', (e, a) => {
    if (a == 'open') createLibary();
});

ipc.on('settingsChange', function(event, arg) {
    intro.send('settingsChange', arg);
});

ipc.on('debug', () => {
    debug = true;
    intro.webContents.openDevTools();
    if (settingsW) settingsW.webContents.openDevTools();
});


ipc.on('log', function(event, arg) {
    console.log(arg);
});

app.on('ready', () => {
    createWindow();
});

app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function() {
    if (intro === null) {
        createWindow();
    }
});