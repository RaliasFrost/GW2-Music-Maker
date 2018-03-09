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

let settings = {
    chordMode: gS("chordMode"),
    global_volume: gS("global_volume"),
    spaceDelay: gS("spaceDelay"),
    autoSpace: gS("autoSpace"),
    editMode: gS("editMode"),
    retain: gS("retain")
};

const {
    remote
} = require('electron');

ipc.on('musicData', function(event, arg) {
    console.log(arg);
});
localStorage.setItem("myCat", "Scratchy");

document.getElementById('close').addEventListener('click', () => {
    remote.getCurrentWindow().close();
});

document.getElementById('minimize').addEventListener('click', () => {
    remote.getCurrentWindow().minimize();
});

$("button, input, a").click(function() {
    ipc.send("settingsChange", Date.now());
});

$('#aSpace').bind('change', function() {
    if ($(this).is(':checked')) {
        sS('autoSpace', 1);
        $('#spaceDelay').spinner('enable');
    } else {
        sS('autoSpace', 0);
        $('#spaceDelay').spinner('disable');
    }
});
$('#retain').bind('change', function() {
    if ($(this).is(':checked')) {
        sS('retain', 1);
    } else {
        sS('retain', 0);
    }
});
$("#vol").text(settings.global_volume);


$(function() {
    $(".checkbox").checkboxradio();


    $(document).tooltip();


    $("#volume").slider({
        min: 0,
        max: 100,
        value: settings.global_volume,
        slide: function(event, ui) {
            $("#vol").text(ui.value);
            sS('global_volume', ui.value);
        }
    });
    $("#volume").width(25);
    var spinner = $("#spaceDelay").spinner({
        min: 0,
        value: settings.spaceDelay,
        max: 10000,
        change: () => {
            sS('spaceDelay', $("#spaceDelay").spinner('value'));
        }
    });

    spinner.spinner("value", settings.spaceDelay);
    if (settings.autoSpace === 1) {
        $('#spaceDelay').spinner('enable');
    } else $('#spaceDelay').spinner('disable');


});

if (settings.autoSpace == 1) {
    $('#aSpace').attr('checked', true);
}
if (settings.retain == 1) $('#retain').attr('checked', true);