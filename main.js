const electron = require('electron');
const app = electron.app;

const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;

const path = require('path');
const url = require('url');
let debug = false
//require('electron-reload')(__dirname);

let intro, settingsW;

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

ipc.on('settingsChange', function(event, arg) {
    intro.send('settingsChange', arg);
});

ipc.on('debug', function(event, arg) {
    debug = true;
    intro.webContents.openDevTools();
    settingsW.webContents.openDevTools();
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