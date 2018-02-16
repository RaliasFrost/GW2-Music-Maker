const electron = require('electron');
const app = electron.app;

const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;

const path = require('path');
const url = require('url');
//require('electron-reload')(__dirname);

let intro;

function createWindow() {
    intro = new BrowserWindow({
        width: 820,
        height: 700,
        frame: false,
        darkTheme: true,
        autoHideMenuBar: true,
        icon: 'assets/images/256.ico'
    });
    //intro.webContents.openDevTools();
    intro.setMenu(null);
    intro.setResizable(false);
    intro.loadURL(url.format({
        pathname: path.join(__dirname, 'assets/windows/intro.html'),
        protocol: 'file:',
        slashes: true
    }));
    intro.on('closed', function() {
        intro = null;
    });
}


ipc.on('musicData', function(event, arg) {
    event.sender.send('musicData', 'pong');
    console.log(arg);
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