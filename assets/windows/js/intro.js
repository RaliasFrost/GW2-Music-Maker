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
    localStorage.setItem("retainedData", $("#songarea").val());
});

document.getElementById('minimize').addEventListener('click', (event) => {
    remote.getCurrentWindow().minimize();
});

document.getElementById('settings').addEventListener('click', (event) => {
    ipc.send('settingsWindow', 'open');
});