/******************************************************************************/
/* Electron Integration                                                       */
/******************************************************************************/
const ipc = require('electron').ipcRenderer;
const {
    remote
} = require('electron');
ipc.on('settingsChange', (event, arg) => {
    console.log(arg);
});
/******************************************************************************/
/* Global letiables                                                           */
/******************************************************************************/
const gS = item => {
    return localStorage.getItem(item);
};
const sS = (item, value) => {
    return localStorage.setItem(item, value);
};
if (!gS("chordMode")) sS("chordMode", 1);
if (!gS("global_volume")) sS("global_volume", 50);
if (!gS("spaceDelay")) sS("spaceDelay", 100);
if (!gS("autoSpace")) sS("autoSpace", 1);

let settings = {
    chordMode: gS("chordMode"),
    global_volume: gS("global_volume"),
    spaceDelay: gS("spaceDelay"),
    autoSpace: gS("autoSpace")
};

let currentOctave = 1;
let note = 'Hi';
let areaPrev;
let currentAudio = new Audio();
let numerator = 1;
let denominator = 1;
let shadowprop = getsupportedprop(['boxShadow',
    'mozBoxShadow',
    'webkitBoxShadow'
]);
let transformprop = getsupportedprop(['webkitTransform',
    'mozTransform',
    'msTransform',
    'oTransform',
    'transform'
]);
let shadowvalue = '0 0 15px 10px #000000 inset';
let transformvalue1 = 'rotateX(90deg)';
let transformvalue2 = 'rotateX(0deg)';
let instrument = null;
let keys = [];
/******************************************************************************/
/* Functions                                                                  */
/******************************************************************************/
const chordRegister = (data) => {
    if (data.state) {
        keys.push(data.key);
    } else {
        keys.splice(keys.indexOf(data.key), 1);
    }
};
let octaveChenged = true;
const chordProcess = () => {
    let textValue = $('#songarea').val();
    let chordRegex = new RegExp(keys.join('') + '$');
    if (settings.chordMode)
        $('#songarea').val(textValue.replace(chordRegex, keys.join('/')));
    keys = [];
};
/**
 * This is to clean up extra whitespace created by the program to trim up the look of the tab
 * @return {null}
 */
const cleanUp = () => {
    $('#songarea').val($('#songarea').val().replace(/  /g, ' '));
    $('#songarea').val($('#songarea').val().replace(/ \)/g, ')'));
    $('#songarea').val($('#songarea').val().replace(/ \]/g, ']'));
    $('#songarea').val($('#songarea').val().replace(/\( /g, '('));
    $('#songarea').val($('#songarea').val().replace(/\[ /g, '['));
};
/**
 * This is to process the notes played and what octave it currently is and appropriatly add tab notation
 * @param  {object} data Data containing the current, and previous octave
 * @return {null}   
 */
const processTab = (data) => {
    let textValue = $('#songarea').val();
    if (data.oChange) {
        switch (data.octave) {
            case 0:
                if (!/\[$/.test(textValue)) {
                    if (instrument != 'redbell' && instrument != 'bass' && instrument != 'flute')
                        if (octaveChenged) {
                            octaveChenged = false;
                            $('#songarea').val(textValue + '[');
                        }
                }
                break;
            case 1:
                if (data.pOctave === 0 && !/\[$/.test(textValue)) {
                    $('#songarea').val(textValue.replace(/ $/, '') + ']');
                    octaveChenged = true;
                    spaceTiming();
                } else if (data.pOctave === 0 && /\[$/.test(textValue)) {
                    $('#songarea').val(textValue.slice(0, -1));
                } else if (data.pOctave == 2 && !/\($/.test(textValue)) {
                    $('#songarea').val(textValue.replace(/ $/, '') + ')');
                    octaveChenged = true;
                    spaceTiming();
                } else if (data.pOctave == 2 && /\($/.test(textValue)) {
                    $('#songarea').val(textValue.slice(0, -1));
                }
                break;
            case 2:
                if (data.pOctave == 1 && !/\($/.test(textValue)) {
                    if (octaveChenged) {
                        octaveChenged = false;
                        $('#songarea').val(textValue + '(');
                    }
                }
                break;
        }
    }
};
/**
 * This is for electron, it is to read what instrument is selected from the hidden url bar
 * @param  {string} sParam Spram is the parameter to retrive from the url string
 * @return {string}        Returns a string of the currently selected instrument
 */
const getUrlParameter = (sParam) => {
    let sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLletiables = sPageURL.split('&'),
        sParameterName,
        i;
    for (i = 0; i < sURLletiables.length; i++) {
        sParameterName = sURLletiables[i].split('=');
        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};
instrument = getUrlParameter('instrument');
// $('#title').innerHtml(`GW2mm - ${instrument}`);
console.log("instrument: " + instrument);
if (!instrument) window.location.replace('./intro.html?instrument=harp');
Array.prototype.pushIfNotExist = function(element) {
    if (jQuery.inArray(element, this) == -1) {
        this.push(element);
        this.sort(function(a, b) {
            let keyA = getKeyOctaveFromPitch(a, 0, location.pathname);
            let keyB = getKeyOctaveFromPitch(b, 0, location.pathname);
            if (keyA[1] > keyB[1]) {
                return 1;
            } else if (keyA[1] < keyB[1]) {
                return -1;
            } else if (keyA[0] > keyB[0]) {
                return 1;
            } else if (keyA[0] < keyB[0]) {
                return -1;
            } else {
                return 0;
            }
        });
    }
};
Array.prototype.removeValue = function(element) {
    let index = this.indexOf(element);
    if (index > -1) {
        this.splice(index, 1);
    }
};
/*
    These following functions I didn't make, and haven't bothered readting through yet and optimizing what I do need and trimming what I don't
 */
const reduce = (num, den) => {
    let gcd = function gcd(a, b) {
        return b ? gcd(b, a % b) : a;
    };
    gcd = gcd(num, den);
    return [num / gcd, den / gcd];
};

function getsupportedprop(proparray) {
    let root = document.documentElement;
    for (let i = 0; i < proparray.length; i++) {
        if (proparray[i] in root.style) {
            return proparray[i];
        }
    }
}

function changecssproperty(target, prop, value, action) {
    if (typeof prop != "undefined") {
        target.style[prop] = (action == "remove") ? "" : value;
    }
}

function fadeoutAudio(tempAudio) {
    $(tempAudio).animate({
        volume: 0
    }, 500);
    setTimeout(function() {
        tempAudio.pause();
    }, 500);
}
/**
 * This is a heavily optimised bit of code i borrowed from GW2mb.com, it use to be much longer, but now it is much better thanks to the use of string templates
 * @param  {string} skill_id The ID for the current skill being pressed
 * @return {string}          Returns the filepath for the desired audio file
 */
const getSoundFileFromSkillId = (skill_id) => {
    let return_soundfile;
    switch (skill_id) {
        case `skill1`:
            return_soundfile = `sound/${instrument}/${currentOctave}/1.mp3`;
            break;
        case `skill2`:
            return_soundfile = `sound/${instrument}/${currentOctave}/2.mp3`;
            break;
        case `skill3`:
            return_soundfile = `sound/${instrument}/${currentOctave}/3.mp3`;
            break;
        case `skill4`:
            return_soundfile = `sound/${instrument}/${currentOctave}/4.mp3`;
            break;
        case `skill5`:
            return_soundfile = `sound/${instrument}/${currentOctave}/5.mp3`;
            break;
        case `skill6`:
            return_soundfile = `sound/${instrument}/${currentOctave}/6.mp3`;
            break;
        case `skill7`:
            return_soundfile = `sound/${instrument}/${currentOctave}/7.mp3`;
            break;
        case `skill8`:
            return_soundfile = `sound/${instrument}/${currentOctave}/8.mp3`;
            break;
    }
    return return_soundfile;
};

function skill(skill_id) {
    let return_string;
    let num_den = reduce(numerator, denominator);
    currentAudio = new Audio(getSoundFileFromSkillId(skill_id));
    currentAudio.volume = (settings.global_volume / 100);
    changecssproperty(document.getElementById(skill_id), shadowprop, shadowvalue);
    if (instrument == "flute" || instrument == "horn") {
        currentAudio.volume = 0;
        currentAudio.play();
        $(currentAudio).animate({
            volume: (settings.global_volume / 100)
        }, 100);
    } else {
        currentAudio.play();
    }

    throw "Musical Note";
}

function octave_down() {
    processTab({
        oChange: true,
        pOctave: currentOctave,
        octave: currentOctave - 1 == -1 ? 0 : currentOctave - 1
    });
    if (instrument == 'flute') {
        changecssproperty(document.getElementById("skill9"), shadowprop, shadowvalue);
        let all = document.getElementsByClassName('skill');
        for (let i = 0; i < all.length; i++) {
            changecssproperty(all[i], transformprop, transformvalue1);
        }
        if (currentOctave == 2)
            currentOctave = 1;
        setTimeout(function() {
            document.getElementById("skill0").style.backgroundImage = "url('image/stop.png')";
            document.getElementById("skill0").style.cursor = "default";
            document.getElementById("skill9").style.backgroundImage = "url('image/octave_up.png')";
            document.getElementById("skill9").style.cursor = "pointer";
            for (let i = 0; i < all.length; i++) {
                changecssproperty(all[i], transformprop, transformvalue2);
            }
        }, 250);
    }
    if (instrument == "redbell" || instrument == "bass") {
        if (currentOctave == 2) {
            currentOctave = 1;
            changecssproperty(document.getElementById("skill9"), shadowprop, shadowvalue);
            let all = document.getElementsByClassName('skill');
            for (let i = 0; i < all.length; i++) {
                changecssproperty(all[i], transformprop, transformvalue1);
            }
            setTimeout(function() {
                document.getElementById("skill0").style.backgroundImage = "url('image/octave_up.png')";
                document.getElementById("skill0").style.cursor = "pointer";
                document.getElementById("skill9").style.backgroundImage = "url('image/lock.png')";
                document.getElementById("skill9").style.cursor = "default";
                for (let i = 0; i < all.length; i++) {
                    changecssproperty(all[i], transformprop, transformvalue2);
                }
            }, 250);
        }
    } else if (instrument != 'flute') {
        if (currentOctave == 1) {
            currentOctave = 0;
            changecssproperty(document.getElementById("skill9"), shadowprop, shadowvalue);
            let all = document.getElementsByClassName('skill');
            for (let i = 0; i < all.length; i++) {
                changecssproperty(all[i], transformprop, transformvalue1);
            }
            setTimeout(function() {
                document.getElementById("skill9").style.backgroundImage = "url('image/lock.png')";
                document.getElementById("skill9").style.cursor = "default";
                for (let i = 0; i < all.length; i++) {
                    changecssproperty(all[i], transformprop, transformvalue2);
                }
            }, 250);
        } else if (currentOctave == 2) {
            currentOctave = 1;
            changecssproperty(document.getElementById("skill9"), shadowprop, shadowvalue);
            let all = document.getElementsByClassName('skill');
            for (let i = 0; i < all.length; i++) {
                changecssproperty(all[i], transformprop, transformvalue1);
            }
            setTimeout(function() {
                document.getElementById("skill0").style.backgroundImage = "url('image/octave_up.png')";
                document.getElementById("skill0").style.cursor = "pointer";
                for (let i = 0; i < all.length; i++) {
                    changecssproperty(all[i], transformprop, transformvalue2);
                }
            }, 250);
        }
    }
}

function octave_up() {
    processTab({
        oChange: true,
        pOctave: currentOctave,
        octave: currentOctave + 1 == 3 ? 2 : currentOctave + 1
    });
    if (instrument == 'flute') {
        changecssproperty(document.getElementById("skill9"), shadowprop, shadowvalue);
        let all = document.getElementsByClassName('skill');
        for (let i = 0; i < all.length; i++) {
            changecssproperty(all[i], transformprop, transformvalue1);
        }
        if (currentOctave == 1) {
            currentOctave = 2;
            setTimeout(function() {
                document.getElementById("skill0").style.backgroundImage = "url('image/stop.png')";
                document.getElementById("skill0").style.cursor = "default";
                document.getElementById("skill9").style.backgroundImage = "url('image/octave_down.png')";
                document.getElementById("skill9").style.cursor = "pointer";
                for (let i = 0; i < all.length; i++) {
                    changecssproperty(all[i], transformprop, transformvalue2);
                }
            }, 250);
        }
    }
    if (instrument == "redbell" || instrument == "bass") {
        if (currentOctave == 1) {
            currentOctave = 2;
            changecssproperty(document.getElementById("skill0"), shadowprop, shadowvalue);
            let all = document.getElementsByClassName('skill');
            for (let i = 0; i < all.length; i++) {
                changecssproperty(all[i], transformprop, transformvalue1);
            }
            setTimeout(function() {
                document.getElementById("skill0").style.backgroundImage = "url('image/lock.png')";
                document.getElementById("skill0").style.cursor = "default";
                document.getElementById("skill9").style.backgroundImage = "url('image/octave_down.png')";
                document.getElementById("skill9").style.cursor = "pointer";
                for (let i = 0; i < all.length; i++) {
                    changecssproperty(all[i], transformprop, transformvalue2);
                }
            }, 250);
        }
    } else if (instrument != 'flute') {
        if (currentOctave === 0) {
            currentOctave = 1;
            changecssproperty(document.getElementById("skill0"), shadowprop, shadowvalue);
            let all = document.getElementsByClassName('skill');
            for (let i = 0; i < all.length; i++) {
                changecssproperty(all[i], transformprop, transformvalue1);
            }
            setTimeout(function() {
                document.getElementById("skill9").style.backgroundImage = "url('image/octave_down.png')";
                document.getElementById("skill9").style.cursor = "pointer";
                for (let i = 0; i < all.length; i++) {
                    changecssproperty(all[i], transformprop, transformvalue2);
                }
            }, 250);
        } else if (currentOctave == 1) {
            currentOctave = 2;
            changecssproperty(document.getElementById("skill0"), shadowprop, shadowvalue);
            let all = document.getElementsByClassName('skill');
            for (let i = 0; i < all.length; i++) {
                changecssproperty(all[i], transformprop, transformvalue1);
            }
            setTimeout(function() {
                document.getElementById("skill0").style.backgroundImage = "url('image/lock.png')";
                document.getElementById("skill0").style.cursor = "default";
                for (let i = 0; i < all.length; i++) {
                    changecssproperty(all[i], transformprop, transformvalue2);
                }
            }, 250);
        }
    }
}
let spacingTime;
const spaceTiming = () => {
    window.clearTimeout(spacingTime);
    spacingTime = setTimeout(() => giveMeSpace(), settings.spaceDelay);
};
const giveMeSpace = () => {
    let textArea = $('#songarea').val();
    if (settings.autoSpace)
        $('#songarea').val(textArea + ' ');
};
let chords = true;
/******************************************************************************/
/* Functions Executed on Page Load                                            */
/******************************************************************************/
$(document).ready(function() {
    if (instrument == 'flute') document.getElementById("skill0").style.backgroundImage = "url('image/stop.png')";
    if (instrument == 'flute') document.getElementById("skill9").style.backgroundImage = "url('image/octave_up.png')";
    document.getElementById(instrument).style.filter = "none";
    if (instrument == "redbell" || instrument == "bass") {
        document.getElementById("skill9").style.backgroundImage = "url('image/lock.png')";
    }
    $("#songarea").focus();
    let down = false;
    $("#skill9").mousedown(function() {
        octave_down();
        down = true;
    });
    /*
    $("#skill9_flute").mousedown(function() {
    octave_down();
    down = true;
    });
    */
    $("#skill0").mousedown(function() {
        octave_up();
        down = true;
    });
    $(document).mouseup(function() {
        if (down) {
            let skills = document.getElementsByClassName("skill");
            for (let i = 0; i < skills.length; i++) {
                changecssproperty(skills[i], shadowprop, '', 'remove');
            }
            changecssproperty(document.getElementById("health"), shadowprop, '', 'remove');
            if (instrument == "flute" || instrument == "horn") {
                fadeoutAudio(currentAudio);
            }
            $("#songarea").focus();
            down = false;
        }
    });
    let firedenter = false;
    let fireddelete = false;
    let firedswap = false;
    let fired1 = false;
    let fired2 = false;
    let fired3 = false;
    let fired4 = false;
    let fired5 = false;
    let fired6 = false;
    let fired7 = false;
    let fired8 = false;
    let fired9 = false;
    let fired0 = false;
    let lastkey;
    document.addEventListener('keydown', function(event) {
        lastkey = event.which;
        if (instrument == "flute" || instrument == "horn" || instrument == "bass") {
            currentAudio.loop = false;
            if (instrument == "flute" || instrument == "horn") {
                fadeoutAudio(currentAudio);
            }
        }
        cleanUp();
        if (event.which == 112) window.location.replace('./intro.html?instrument=harp');
        if (event.which == 113) window.location.replace('./intro.html?instrument=bell');
        if (event.which == 114) window.location.replace('./intro.html?instrument=redbell');
        if (event.which == 115) window.location.replace('./intro.html?instrument=bass');
        if (event.which == 116) window.location.replace('./intro.html?instrument=lute');
        if (event.which == 117) window.location.replace('./intro.html?instrument=horn');
        if (event.which == 118) window.location.replace('./intro.html?instrument=flute');
        $("#songarea").focus();
        if (chords) {
            if (instrument == "flute" || instrument == "horn" || instrument == "bell" || instrument == 'bass')
                if (!chords) return;
                else chords = false;
            if (event.which == 49 || event.which == 97) {
                if (!fired1) {
                    fired1 = true;
                    chordRegister({
                        state: true,
                        key: 1
                    });
                    switch (currentOctave) {
                        case 0:
                            note = '[1]';
                            break;
                        case 1:
                            note = 1;
                            break;
                        case 2:
                            note = `(1)`;
                            break;
                    }
                    skill("skill1");
                }
                event.preventDefault();
                event.stopPropagation();
                return false;
            } else if (event.which == 50 || event.which == 98) {
                if (!fired2) {
                    fired2 = true;
                    chordRegister({
                        state: true,
                        key: 2
                    });
                    switch (currentOctave) {
                        case 0:
                            note = '[2]';
                            break;
                        case 1:
                            note = 2;
                            break;
                        case 2:
                            note = `(2)`;
                            break;
                    }
                    skill("skill2");
                }
                event.preventDefault();
                event.stopPropagation();
                return false;
            } else if (event.which == 51 || event.which == 99) {
                if (!fired3) {
                    fired3 = true;
                    chordRegister({
                        state: true,
                        key: 3
                    });
                    switch (currentOctave) {
                        case 0:
                            note = '[3]';
                            break;
                        case 1:
                            note = 3;
                            break;
                        case 2:
                            note = `(3)`;
                            break;
                    }
                    skill("skill3");
                }
                event.preventDefault();
                event.stopPropagation();
                return false;
            } else if (event.which == 52 || event.which == 100) {
                if (!fired4) {
                    fired4 = true;
                    chordRegister({
                        state: true,
                        key: 4
                    });
                    switch (currentOctave) {
                        case 0:
                            note = '[4]';
                            break;
                        case 1:
                            note = 4;
                            break;
                        case 2:
                            note = `(4)`;
                            break;
                    }
                    skill("skill4");
                }
                event.preventDefault();
                event.stopPropagation();
                return false;
            } else if (event.which == 53 || event.which == 101) {
                if (!fired5) {
                    fired5 = true;
                    chordRegister({
                        state: true,
                        key: 5
                    });
                    switch (currentOctave) {
                        case 0:
                            note = '[5]';
                            break;
                        case 1:
                            note = 5;
                            break;
                        case 2:
                            note = `(5)`;
                            break;
                    }
                    skill("skill5");
                }
                event.preventDefault();
                event.stopPropagation();
                return false;
            } else if (event.which == 54 || event.which == 102) {
                if (!fired6) {
                    fired6 = true;
                    chordRegister({
                        state: true,
                        key: 6
                    });
                    switch (currentOctave) {
                        case 0:
                            note = '[6]';
                            break;
                        case 1:
                            note = 6;
                            break;
                        case 2:
                            note = `(6)`;
                            break;
                    }
                    skill("skill6");
                }
                event.preventDefault();
                event.stopPropagation();
                return false;
            } else if (event.which == 55 || event.which == 103) {
                if (!fired7) {
                    fired7 = true;
                    chordRegister({
                        state: true,
                        key: 7
                    });
                    switch (currentOctave) {
                        case 0:
                            note = '[7]';
                            break;
                        case 1:
                            note = 7;
                            break;
                        case 2:
                            note = `(7)`;
                            break;
                    }
                    skill("skill7");
                }
                event.preventDefault();
                event.stopPropagation();
                return false;
            } else if (event.which == 56 || event.which == 104) {
                if (!fired8) {
                    fired8 = true;
                    chordRegister({
                        state: true,
                        key: 8
                    });
                    switch (currentOctave) {
                        case 0:
                            note = '[8]';
                            break;
                        case 1:
                            note = 8;
                            break;
                        case 2:
                            note = `(8)`;
                            break;
                    }
                    skill("skill8");
                }
                event.preventDefault();
                event.stopPropagation();
                return false;
            } else if (event.which == 57 || event.which == 105) {
                if (!fired9 && instrument != 'flute') {
                    fired9 = true;
                    octave_down();
                }
                if (instrument == 'flute') {
                    if (currentOctave == 1) octave_up();
                    else octave_down();
                }
                event.preventDefault();
                event.stopPropagation();
                return false;
            } else if (event.which == 48 || event.which == 96) {
                if (instrument == "flute" || instrument == "horn") {
                    fadeoutAudio(currentAudio);
                }
                if (!fired0 && instrument != 'flute') {
                    fired0 = true;
                    octave_up();
                } else {
                    changecssproperty(document.getElementById("skill0"), shadowprop, shadowvalue);
                    currentAudio.loop = false;
                    fadeoutAudio(currentAudio);
                }
                event.preventDefault();
                event.stopPropagation();
                return false;
            } else {
                if (!$('input[type=checkbox]').is(":checked")) {
                    $('#songarea').val(areaPrev);
                }
            }
        }
    });
    document.addEventListener('keyup', function(event) {
        let textArea = $('#songarea').val();
        console.log(textArea);
        cleanUp();
        chordProcess();
        if (event.which == 187) {
            firedenter = false;
            $("#songarea").focus();
        } else if (event.which == 189) {
            fireddelete = false;
            $("#songarea").focus();
        } else if (event.which == 192) {
            firedswap = false;
            $("#songarea").focus();
        } else if (event.which == 49 || event.which == 97) {
            spaceTiming();
            fired1 = false;
            chordRegister({
                state: false,
                key: 1
            });
            changecssproperty(document.getElementById("skill1"), shadowprop, '', 'remove');
            if (instrument == "flute" || instrument == "horn") {
                if (getSoundFileFromSkillId("skill1") == currentAudio.src) {
                    fadeoutAudio(currentAudio);
                }
            }
            $("#songarea").focus();
        } else if (event.which == 50 || event.which == 98) {
            spaceTiming();
            fired2 = false;
            chordRegister({
                state: false,
                key: 2
            });
            changecssproperty(document.getElementById("skill2"), shadowprop, '', 'remove');
            if (instrument == "flute" || instrument == "horn") {
                if (getSoundFileFromSkillId("skill2") == currentAudio.src) {
                    fadeoutAudio(currentAudio);
                }
            }
            $("#songarea").focus();
        } else if (event.which == 51 || event.which == 99) {
            spaceTiming();
            fired3 = false;
            chordRegister({
                state: false,
                key: 3
            });
            changecssproperty(document.getElementById("skill3"), shadowprop, '', 'remove');
            if (instrument == "flute" || instrument == "horn") {
                if (getSoundFileFromSkillId("skill3") == currentAudio.src) {
                    fadeoutAudio(currentAudio);
                }
            }
            $("#songarea").focus();
        } else if (event.which == 52 || event.which == 100) {
            spaceTiming();
            fired4 = false;
            chordRegister({
                state: false,
                key: 4
            });
            changecssproperty(document.getElementById("skill4"), shadowprop, '', 'remove');
            if (instrument == "flute" || instrument == "horn") {
                if (getSoundFileFromSkillId("skill4") == currentAudio.src) {
                    fadeoutAudio(currentAudio);
                }
            }
            $("#songarea").focus();
        } else if (event.which == 53 || event.which == 101) {
            spacingTime = setTimeout(() => giveMeSpace(), 500);
            fired5 = false;
            chordRegister({
                state: false,
                key: 5
            });
            changecssproperty(document.getElementById("skill5"), shadowprop, '', 'remove');
            if (instrument == "flute" || instrument == "horn") {
                if (getSoundFileFromSkillId("skill5") == currentAudio.src) {
                    fadeoutAudio(currentAudio);
                }
            }
            $("#songarea").focus();
        } else if (event.which == 54 || event.which == 102) {
            spaceTiming();
            fired6 = false;
            chordRegister({
                state: false,
                key: 6
            });
            changecssproperty(document.getElementById("skill6"), shadowprop, '', 'remove');
            if (instrument == "flute" || instrument == "horn") {
                if (getSoundFileFromSkillId("skill6") == currentAudio.src) {
                    fadeoutAudio(currentAudio);
                }
            }
            $("#songarea").focus();
        } else if (event.which == 55 || event.which == 103) {
            spaceTiming();
            fired7 = false;
            chordRegister({
                state: false,
                key: 7
            });
            changecssproperty(document.getElementById("skill7"), shadowprop, '', 'remove');
            if (instrument == "flute" || instrument == "horn") {
                if (getSoundFileFromSkillId("skill7") == currentAudio.src) {
                    fadeoutAudio(currentAudio);
                }
            }
            $("#songarea").focus();
        } else if (event.which == 56 || event.which == 104) {
            spaceTiming();
            fired8 = false;
            chordRegister({
                state: false,
                key: 8
            });
            changecssproperty(document.getElementById("skill8"), shadowprop, '', 'remove');
            if (instrument == "flute" || instrument == "horn") {
                if (getSoundFileFromSkillId("skill8") == currentAudio.src) {
                    fadeoutAudio(currentAudio);
                }
            }
            $("#songarea").focus();
        } else if (event.which == 57 || event.which == 105) {
            fired9 = false;
            changecssproperty(document.getElementById("skill9"), shadowprop, '', 'remove');
            $("#songarea").focus();
        } else if (event.which == 48 || event.which == 96) {
            fired0 = false;
            changecssproperty(document.getElementById("skill0"), shadowprop, '', 'remove');
            $("#songarea").focus();
        } else {
            if ($('input[type=checkbox]').is(":checked")) {
                let textArea = $('#songarea').val();
                if (/debug/i.test(textArea)) remote.getCurrentWindow().toggleDevTools();
                if (/beemovie/i.test(textArea)) {
                    $.get("https://gist.githubusercontent.com/ajn0592/6ae63abd1834485811200daefc319b40/raw/2411e31293a35f3e565f61e7490a806d4720ea7e/bee%2520movie%2520script", function(data) {
                        $("#songarea").val(data);
                    });
                }
            } else {
                if (!/ $/.test(textArea)) $('#songarea').val(textArea.replace(/.$/, ''));
            }
        }
        areaPrev = $('#songarea').val();
        if (!fired1 && !fired2 && !fired3 && !fired4 && !fired5 && !fired6 && !fired7 && !fired8) chords = true;
    });
});