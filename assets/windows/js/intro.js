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

document.getElementById('settings').addEventListener('click', (event) => {
    ipc.send('settingsWindow', 'open');
    remote.settingsWindow();
});