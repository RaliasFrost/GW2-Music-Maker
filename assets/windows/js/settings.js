const ipc = require('electron').ipcRenderer;

console.log = function(x) {
    ipc.send('log', x);
};

const {
    remote
} = require('electron');

ipc.on('musicData', function(event, arg) {
    console.log(arg);
});


document.getElementById('close').addEventListener('click', (event) => {
    remote.getCurrentWindow().close();
});

document.getElementById('minimize').addEventListener('click', (event) => {
    remote.getCurrentWindow().minimize();
});