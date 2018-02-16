/******************************************************************************/
/* Global letiables                                                           */
/******************************************************************************/

// the current octave of the instrument
let currentOctave = 1;
let note = 'Hi';
// this holds the currently playing audio file. this is necessary for fadeing
// notes out
let currentAudio = new Audio();
// used to stop playback
let stopPlayback = false;
// used to show that a song is currently playing back
let nowPlaying = false;
// the song id of the currently playing song. used to stop playback for the
// current song on the archive page
let nowPlayingID = 0;
// used to remember which song to add a comment to
let commentSongID = 0;
// recording (1) or not recording (0)
let combatMode = 1;
// chord mode off (0) chord mode on (1)
let chordMode = 0;
// the notes in the current chord
let chordArray = [];
// the tempo, meter, and volume of the current song
let global_tempo = 90;
let global_meter = 4;
let global_volume = 30;
// numerator and denominator of the note length multiplier
let numerator = 1;
let denominator = 1;
// hotkeys off = false hotkeys on = true
let hotkeys = true;
// properties to test for shadow
let shadowprop = getsupportedprop(['boxShadow',
    'mozBoxShadow',
    'webkitBoxShadow'
]);
// properties to test for transforming
let transformprop = getsupportedprop(['webkitTransform',
    'mozTransform',
    'msTransform',
    'oTransform',
    'transform'
]);

// this is the shadow property used when a key is pressed
let shadowvalue = '0 0 15px 10px #000000 inset';
// these are the rotate values for when changing octaves
let transformvalue1 = 'rotateX(90deg)';
let transformvalue2 = 'rotateX(0deg)';
// this global letiable is used to stop double posts when the add comment button
// is clicked twice
// 
let addCommentClicked = false;

let instrument = null;

let keysSinceOChange = [];
let keys = [];

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
    $('#songarea').val(textValue.replace(chordRegex, keys.join('/')));
    keys = [];
};

const cleanUp = () => {
    $('#songarea').val($('#songarea').val().replace(/  /g, ' '));
    $('#songarea').val($('#songarea').val().replace(/ \)/g, ')'));
    $('#songarea').val($('#songarea').val().replace(/ \]/g, ']'));
    $('#songarea').val($('#songarea').val().replace(/\( /g, '('));
    $('#songarea').val($('#songarea').val().replace(/\[ /g, '['));
};

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
                if (data.pOctave == 0 && !/\[$/.test(textValue)) {
                    $('#songarea').val(textValue.replace(/ $/, '') + ']');
                    octaveChenged = true;
                    spaceTiming();
                } else if (data.pOctave == 0 && /\[$/.test(textValue)) {
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


/******************************************************************************/
/* Functions                                                                  */
/******************************************************************************/

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
    // this if statement should never be false, but i've left it in since
    // it doesn't hurt anything
    if (jQuery.inArray(element, this) == -1) {
        this.push(element);
        this.sort(function(a, b) {
            let keyA = getKeyOctaveFromPitch(a, 0, location.pathname);
            let keyB = getKeyOctaveFromPitch(b, 0, location.pathname);
            // compare octaves first
            if (keyA[1] > keyB[1]) {
                return 1;
            } else if (keyA[1] < keyB[1]) {
                return -1;
            }
            // then compare the notes themselves
            else if (keyA[0] > keyB[0]) {
                return 1;
            } else if (keyA[0] < keyB[0]) {
                return -1;
            }
            // if it gets this far then they are equal
            else {
                return 0;
            }
        });
    }
};

// remove the given element from the array
Array.prototype.removeValue = function(element) {
    let index = this.indexOf(element);
    if (index > -1) {
        this.splice(index, 1);
    }
};

// Reduce a fraction by finding the Greatest Common Divisor and dividing by it.
function reduce(num, den) {
    let gcd = function gcd(a, b) {
        return b ? gcd(b, a % b) : a;
    };
    gcd = gcd(num, den);
    return [num / gcd, den / gcd];
}

// remove the given characters from the given string
function stripchars(string, chars) {
    return string.replace(RegExp('[' + chars + ']', 'g'), '');
}

// return the property from the given array that works in the current browser
function getsupportedprop(proparray) {
    let root = document.documentElement; //reference root element of document
    for (let i = 0; i < proparray.length; i++) { //loop through possible properties
        if (proparray[i] in root.style) { //if property exists on element (value will be string, empty string if not set)
            return proparray[i]; //return that string
        }
    }
}

// change css3 property
function changecssproperty(target, prop, value, action) {
    if (typeof prop != "undefined") {
        target.style[prop] = (action == "remove") ? "" : value;
    }
}

// switch to and from combat mode
function swap() {
    if ($('#centerskillbackground').css('opacity') == 0) {
        stopPlayback = true;
        $("#centerskillbackground").css("opacity", 1);
        $("#nextnotelength").css("opacity", 1);
        $("#options").css("opacity", 1);
        $("#blockui1").css("display", "none");
        $("#blockui2").css("display", "none");
        combatMode = 1;
    } else {
        $("#centerskillbackground").css("opacity", 0);
        $("#nextnotelength").css("opacity", 0);
        $("#options").css("opacity", 0);
        $("#blockui1").css("display", "block");
        $("#blockui2").css("display", "block");
        chordArray = [];
        setTimeout(function() {
            $("#chord").val("Enable Chord Mode");
            $("#currentNotesInChord").html("");
        }, 500);
        combatMode = 0;
        chordMode = 0;
    }
}

//fade out the current audio without interupting future notes
function fadeoutAudio(tempAudio) {
    $(tempAudio).animate({
        volume: 0
    }, 500);
    setTimeout(function() {
        tempAudio.pause();
    }, 500);
}

// get the sound file URL based on the octave, instrument, and skill id
function getSoundFileFromSkillId(skill_id) {
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
}

// this function is called when a skill button is pressed
function skill(skill_id) {
    let return_string;
    // reduce the numerator and denominator (ex. 6/4 => 3/2) and store the
    // result in num_den array
    let num_den = reduce(numerator, denominator);

    //stop audio if flute or horn before beginning a new note


    // select the note and instrument to play and prepare the audio for playback
    currentAudio = new Audio(getSoundFileFromSkillId(skill_id));
    currentAudio.volume = (global_volume / 100);

    // get the note that should be written to the songarea

    // apply the shadow property to the skill icon
    changecssproperty(document.getElementById(skill_id), shadowprop, shadowvalue);

    // if chord mode is not enabled, play the note
    if (chordMode == 0) {
        // play the note
        if (instrument == "flute" || instrument == "horn") {
            currentAudio.volume = 0;
            currentAudio.play();
            $(currentAudio).animate({
                volume: (global_volume / 100)
            }, 100);
        } else {
            currentAudio.play();
        }
    } else {
        // if chord mode is enabled and the note is unselected, add the note to
        // the chordArray, and play the note
        if (jQuery.inArray(note, chordArray) == -1) {
            chordArray.pushIfNotExist(note);
            return_string = "";
            // create the chord array for display above the chord mode button
            for (let i = 0; i < chordArray.length; i++) {
                return_string += "<span class=\"chordArrayMember\" onclick=\"removeChordArrayMember('" + addslashes(chordArray[i]) + "');\">" + chordArray[i] + "</span>";
            }
            $("#currentNotesInChord").html(return_string);
            // play the note
            if (instrument == "flute" || instrument == "horn") {
                currentAudio.volume = 0;
                currentAudio.play();
                $(currentAudio).animate({
                    volume: (global_volume / 100)
                }, 100);
            } else {
                currentAudio.play();
            }
        }
        // if chord mode is enabled and the note is selected, remove the note
        // from the chordArray
        else {
            chordArray.removeValue(note);
            return_string = "";
            // create the chord array for display above the chord mode button
            for (let i = 0; i < chordArray.length; i++) {
                return_string += "<span class=\"chordArrayMember\" onclick=\"removeChordArrayMember('" + addslashes(chordArray[i]) + "');\">" + chordArray[i] + "</span>";
            }
            $("#currentNotesInChord").html(return_string);
        }
    }

    // add the note length multiplier to the end of the note
    if (num_den[0] == num_den[1]) {
        note = note + " ";
    } else if (num_den[1] == 1) {
        note = note + num_den[0] + " ";
    } else if (num_den[0] == 1) {
        note = note + "/" + num_den[1] + " ";
    } else {
        note = note + num_den[0] + "/" + num_den[1] + " ";
    }

    // if combatMode is enabled and chordMode is not, write the note to the
    // songarea
    throw "Musical Note";
}

// this function is invoked when the ocrave down button is pressed
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



// this function is invoked when the octave up button is pressed
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
        if (currentOctave == 0) {
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
    spacingTime = setTimeout(() => giveMeSpace(), 100);
};

const giveMeSpace = () => {
    let textArea = $('#songarea').val();
    $('#songarea').val(textArea + ' ');
};

let chords = true;

let instrumentCheck = () => {
    switch (instrument) {
        case 'flute':
            if (chords) chords = false;
            else chords = true;
            break;
        case 'bell':
            if (chords) chords = false;
            else chords = true;
            break;
        case 'horn':
            if (chords) chords = false;
            else chords = true;
            break;
        default:
            return;
    }
};

/******************************************************************************/
/* Functions Executed on Page Load                                            */
/******************************************************************************/

let resetInterval;

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
                // remove the shadow
                changecssproperty(skills[i], shadowprop, '', 'remove');
            }
            // remove the shadow
            changecssproperty(document.getElementById("health"), shadowprop, '', 'remove');
            // fadeout audio if flute or horn
            if (instrument == "flute" || instrument == "horn") {
                fadeoutAudio(currentAudio);
            }
            // focus on the text area to make the cursor appear
            $("#songarea").focus();
            // reset the down letiable
            down = false;
        }
    });

    // these letiables help control the hotkeys so holding down doesnt repeat
    // the key press
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
            }
        }

    });

    document.addEventListener('keyup', function(event) {
        cleanUp();
        chordProcess();
        if (event.which == 187) {
            firedenter = false;
            // focus on the text area to make the cursor appear
            $("#songarea").focus();
        } else if (event.which == 189) {
            fireddelete = false;
            // focus on the text area to make the cursor appear
            $("#songarea").focus();
        } else if (event.which == 192) {
            firedswap = false;
            // focus on the text area to make the cursor appear
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
            // focus on the text area to make the cursor appear
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
            // focus on the text area to make the cursor appear
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
            // focus on the text area to make the cursor appear
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
            // focus on the text area to make the cursor appear
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
            // focus on the text area to make the cursor appear
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
            // focus on the text area to make the cursor appear
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
            // focus on the text area to make the cursor appear
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
            // focus on the text area to make the cursor appear
            $("#songarea").focus();
        } else if (event.which == 57 || event.which == 105) {
            fired9 = false;
            changecssproperty(document.getElementById("skill9"), shadowprop, '', 'remove');
            // focus on the text area to make the cursor appear
            $("#songarea").focus();
        } else if (event.which == 48 || event.which == 96) {
            fired0 = false;
            changecssproperty(document.getElementById("skill0"), shadowprop, '', 'remove');
            // focus on the text area to make the cursor appear
            $("#songarea").focus();
        } else {
            let textArea = $('#songarea').val();
            if (!/ $/.test(textArea))
                $('#songarea').val(textArea.replace(/.$/, ''));
        }

        if (!fired1 && !fired2 && !fired3 && !fired4 && !fired5 && !fired6 && !fired7 && !fired8) chords = true;

    });
});