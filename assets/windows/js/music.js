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
let global_volume = 50;
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
let addCommentClicked = false;

let instrument = null;


let keys = [];

const noteRegister = (data) => {
    if (data.state) {
        keys.push(data.key);
    } else {
        keys.splice(keys.indexOf(data.key), 1);
    }
};



/******************************************************************************/
/* Functions                                                                  */
/******************************************************************************/

let getUrlParameter = function getUrlParameter(sParam) {
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
console.log("instrument: " + instrument);
if (!instrument) window.location.replace('./intro.html?instrument=harp');


// fade in the black overlay and the given lightbox
function overlay(lightbox_id) {
    $("#fade").fadeIn("slow");
    $("#" + lightbox_id + "_lightbox").fadeIn("slow");
    // focus on the first input in the lightbox
    $('input:visible:enabled:first').focus();
}

// fade out the black overlay and the given lightbox
function disoverlay(lightbox_id) {
    $("#fade").fadeOut("slow");
    $("#" + lightbox_id + "_lightbox").fadeOut("slow");
    // clear the error text for the given lightbox
    setTimeout(function() {
        $("#add_err_" + lightbox_id).html("<br />");
    }, 600);
}

// fade out the login lightbox and fade in the register lightbox without
// fading out the black background
function login_to_register() {
    $("#login_lightbox").fadeOut("slow");
    $("#register_lightbox").fadeIn("slow");
    $('#name_register').focus();
}

// fade out the login lightbox and fade in the forgot lightbox without
// fading out the black background
function login_to_forgot() {
    $("#login_lightbox").fadeOut("slow");
    $("#forgot_lightbox").fadeIn("slow");
    $('#mail_forgot').focus();
}

// fade out the register lightbox and fade in the login lightbox without
// fading out the black background
function register_to_login() {
    $("#register_lightbox").fadeOut("slow");
    $("#login_lightbox").fadeIn("slow");
    $('#name_login').focus();
}

// add the element to the array if it does not already exist then sort the array
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

//return the supported format as a file extension string
function audioSupport() {
    let a = document.createElement('audio');
    let ogg = !!(a.canPlayType && a.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, ''));
    if (ogg)
        return '';
    let mp3 = !!(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, ''));
    if (mp3)
        return '';
    else
        return 0;
}

// fetch the comments for the given song with ajax
function get_comments(song_id) {
    $.ajax({
        type: "POST",
        url: "sql/get_comments",
        data: "song_id=" + song_id,
        success: function(html) {
            $("#comments_area").html(html);
            overlay('comments');
            commentSongID = song_id;
        }
    });
    return false;
}

// make text safe to print to document. imitates the php function of the same
// name
function htmlentities(rawStr) {
    return rawStr.replace(/[\u00A0-\u99999<>\&]/gim, function(i) {
        return '&#' + i.charCodeAt(0) + ';';
    });
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

// opens the window in a new tab
function openInNewTab(url) {
    let win = window.open(url, '_blank');
    win.focus();
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

// get the sound file from the abc Pitch
function getSoundFileFromPitch(pitch, instrument) {
    let charArray = pitch.split('');
    let link_base = "http://gw2mb.com/sound/";
    let instrument_core = instrument.replace("", "").replace("/", "");
    let letter = charArray[0].toUpperCase();
    let octave;
    let file_extension;

    // find the octave in standard notation
    if (charArray[0] == charArray[0].toUpperCase()) {
        if ((pitch.split(",").length - 1) == 0)
            octave = "4";
        else if ((pitch.split(",").length - 1) == 1)
            octave = "3";
        else if ((pitch.split(",").length - 1) == 2)
            octave = "2";
        else if ((pitch.split(",").length - 1) == 3)
            octave = "1";
        else
            return "";
    } else if (charArray[0] == charArray[0].toLowerCase()) {
        if ((pitch.split("'").length - 1) == 0)
            octave = "5";
        else if ((pitch.split("'").length - 1) == 1)
            octave = "6";
        else if ((pitch.split("'").length - 1) == 2)
            octave = "7";
        else
            return "";
    }

    // get the file extension depending on the browser
    file_extension = audioSupport();

    // return the full path to the sound file
    return link_base + instrument_core + "/" + letter + octave + file_extension;
}

// using the given meter, tempo, and noteLength. return the noteLength in ms
function getDelayFromNoteLength(noteLength, meter, tempo) {
    charArray = noteLength.split('/');
    let num;
    let denom;

    if (noteLength == "") {
        num = 1;
        denom = 1;
    } else if (charArray.length == 1 && charArray[0] != "" && !isNaN(charArray[0])) {
        num = charArray[0];
        denom = 1;
    } else if (charArray.length == 2 && charArray[0] == "" && !isNaN(charArray[1])) {
        num = 1;
        denom = charArray[1];
    } else if (charArray.length == 2 && !isNaN(charArray[0]) && !isNaN(charArray[1])) {
        num = charArray[0];
        denom = charArray[1];
    } else {
        return "";
    }

    //check for the case where the user entered a zero
    if (num == 0 || denom == 0) {
        return "";
    }

    return (((((60 / tempo) * 4) / (16 / meter)) * 1000) * (num / denom)).toFixed();
}

// verify that the pitch portion of the ABC note has valid syntax
function checkPitchSyntax(pitch) {

    let charArray = pitch.split('');

    // if the note is lower case make sure the rest of the string is single quotes
    if (/^[a-gz]$/.test(charArray[0])) {
        for (let i = 1; i < charArray.length; i++) {
            if (charArray[i] != "'") {
                return false;
            }
        }
    }
    // if the note is upper case make sure the rest of the string is commas
    else if (/^[A-GZ]$/.test(charArray[0])) {
        for (let i = 1; i < charArray.length; i++) {
            if (charArray[i] != ",") {
                return false;
            }
        }
    }
    // syntax error
    else {
        if (typeof console != "undefined") {
            console.log(pitch);
        }
        return false;
    }
    // syntax is good
    return true;
}

// returns the sound file and note length in milliseconds
function parseABCNote(note, instrument, meter, tempo) {
    let return_array = [];

    // if there is no note return an error
    if (note == "")
        return "";

    let pitch = stripchars(note, "/1234567890");
    let noteLength = stripchars(note, "abcdefgzABCDEFGZ\\[\\],'");

    let charArray = pitch.split('');

    // if the pitch is a chord
    if (charArray[0] == '[') {
        // check to make sure the chord is ended properly
        if (charArray[charArray.length - 1] != ']') {
            return "";
        }

        let pitchArray = [];
        let pitchIndex = -1;
        //populate the pitch array
        for (let i = 1; i < charArray.length - 1; i++) {
            if (/^[a-gA-G]$/.test(charArray[i])) {
                pitchIndex++;
                pitchArray[pitchIndex] = charArray[i];
            } else {
                pitchArray[pitchIndex] = pitchArray[pitchIndex] + charArray[i];
            }
        }

        // remove duplicate values from array
        let uniquePitchArray = [];
        $.each(pitchArray, function(i, el) {
            if ($.inArray(el, uniquePitchArray) === -1)
                uniquePitchArray.push(el);
        });

        // assign the now unique array back to the original array
        pitchArray = uniquePitchArray.slice();

        return_array[0] = [];
        for (let i = 0; i < pitchArray.length; i++) {
            // check to make sure each note is well formed
            if (checkPitchSyntax(pitchArray[i]) == false) {
                return "";
            }

            // assign sound files to return array
            return_array[0][i] = getSoundFileFromPitch(pitchArray[i], instrument);
        }
    } else {
        if (checkPitchSyntax(pitch) == false) {
            return "";
        }
        return_array[0] = getSoundFileFromPitch(pitch, instrument);
    }

    return_array[1] = getDelayFromNoteLength(noteLength, meter, tempo);

    if (return_array[0] == "" || return_array[1] == "")
        return "";
    else
        return return_array;
}

// make sure the playback and export work
function checkSyntax(songtext, instrument) {
    let notes = songtext.trim().split(/\s+/);

    // check each note for playback compatibility
    for (let i = 0; i < notes.length; i++) {
        if (parseABCNote(notes[i], instrument, global_meter, global_tempo) == "") {
            if (typeof console != "undefined") {
                console.log(notes[i]);
            }
            return false;
        }
    }

    // make sure the song can be exported
    if (constructManualScript(notes, instrument, "Dummy") == "") {
        return false;
    } else if (constructAutoScript(notes, instrument, global_meter, global_tempo) == "") {
        return false;
    }

    // syntax okay
    return true;
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
    console.log(note);

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


// add slashes when the str includes single quotes
function addslashes(str) {
    return (str).replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}

// remove the given note from the chord array and reprint the chord array
function removeChordArrayMember(note) {
    chordArray.removeValue(note);
    let return_string = "";
    for (let i = 0; i < chordArray.length; i++) {
        return_string += "<span class=\"chordArrayMember\" onclick=\"removeChordArrayMember('" + addslashes(chordArray[i]) + "');\">" + chordArray[i] + "</span>";
    }
    $("#currentNotesInChord").html(return_string);
}

// this function is invoked when the ocrave down button is pressed
function octave_down() {
    if (instrument == "flute" || instrument == "redbell" || instrument == "bass") {
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
    } else {
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



// this function is invoked when the ocrave up button is pressed
function octave_up() {
    if (instrument == "flute" || instrument == "redbell" || instrument == "bass") {
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
    } else {
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

// this function plays the given notes. the index parameter is used for
// recursion. the initial function call should use zero for index
function playback(notes, index) {
    let audio;
    let notePair;

    // check to make sure the song is not empty, playback is not false, you have not receached the end of the song, and parseABCNote returned no errors
    if (notes != "" && stopPlayback == false && index < notes.length && (notePair = parseABCNote(notes[index], location.pathname, global_meter, global_tempo)) != "") {
        // if note is chord
        if (notePair[0] instanceof Array) {
            // play all notes in the chord
            for (let i = 0; i < notePair[0].length; i++) {
                audio = new Audio(notePair[0][i]);
                audio.volume = global_volume / 100;
                audio.play();
            }
        }
        // if note is individual
        else {
            let charArray = notes[index].split("");
            // if not a rest, play the not
            if (!(charArray[0] == "Z" || charArray[0] == "z")) {
                audio = new Audio(notePair[0]);
                audio.volume = global_volume / 100;
                if (instrument == "flute" || instrument == "horn") {
                    audio.volume = 0;
                    audio.play();
                    $(audio).animate({
                        volume: (global_volume / 100)
                    }, 100);
                } else {
                    audio.play();
                }
            }
        }
        // fade out the note if it is a flute or horn
        setTimeout(function() {
            if (instrument == "flute" || instrument == "horn" || instrument == "bass") {
                fadeoutAudio(audio);
            }
            playback(notes, index + 1);
        }, notePair[1]);
    }
    // handle the song ending for any reason
    else {
        stopPlayback = false;
        nowPlaying = false;
        $("#add_err_song").show();
        if (index == notes.length) {
            $("#add_err_song").html("Playback complete");
        } else if (index == notes.length - 1 && notes[index] == "") {
            $("#add_err_song").html("Playback complete");
        } else if (notes == "") {
            $("#add_err_song").html("Song text is empty");
        } else if (notePair == "") {
            $("#add_err_song").html("Syntax error(s) in song");
        } else {
            $("#add_err_song").html("Playback stopped by user");
        }
        $("#add_err_song").delay(2000).fadeOut("slow");
    }
}
// this function finds the best direction to play a multi octave chord in order
// to reduce octave switches
function findDirection(octaveArray, startingOctave) {
    let one = true;
    let two = true;
    let zero = true;
    //check if the chord is only in one octave
    for (let i = 0; i < octaveArray.length; i++) {
        if (octaveArray[i] == 2 || octaveArray[i] == 0) {
            one = false;
        }
    }
    for (let i = 0; i < octaveArray.length; i++) {
        if (octaveArray[i] == 1 || octaveArray[i] == 0 || octaveArray[i] == 0.5) {
            two = false;
        }
    }
    for (let i = 0; i < octaveArray.length; i++) {
        if (octaveArray[i] == 1 || octaveArray[i] == 2 || octaveArray[i] == 1.5) {
            zero = false;
        }
    }
    if (one == true) {
        return "1";
    } else if (two == true) {
        return "2";
    } else if (zero == true) {
        return "0";
    }

    // check the two easy cases
    if (startingOctave == 0) {
        return "up";
    } else if (startingOctave == 2) {
        return "down";
    } else {
        // play the chord in the direction that the majority of the notes are in
        let sum = octaveArray.reduce(function(a, b) {
            return a + b;
        });
        let avg = sum / octaveArray.length;
        if (avg > 1) {
            return "up";
        } else if (avg < 1) {
            return "down";
        } else {
            return "up";
        }
    }
}

// get the key to be pressed and the guild wars 2 octave from the abc pitch
function getKeyOctaveFromPitch(pitch, previousNoteOctave, instrument) {
    let return_array = [];
    let charArray = pitch.split('');
    let currentNoteOctave;

    // if there are multiple pitches create an array
    if (charArray[0] == "[") {
        let pitchArray = [];
        let pitchIndex = -1;
        //populate the pitch array
        for (let i = 1; i < charArray.length - 1; i++) {
            if (/^[a-gA-G]$/.test(charArray[i])) {
                pitchIndex++;
                pitchArray[pitchIndex] = charArray[i];
            } else {
                pitchArray[pitchIndex] = pitchArray[pitchIndex] + charArray[i];
            }
        }

        for (let i = 0; i < pitchArray.length; i++) {
            //check syntax and return error if bad syntax
            if (checkPitchSyntax(pitchArray[i]) == false) {
                return "";
            }
        }

        // sort the pitch array in case the user manually input his chord out
        // of order.
        pitchArray.sort(function(a, b) {
            let keyA = getKeyOctaveFromPitch(a, 0, instrument);
            let keyB = getKeyOctaveFromPitch(b, 0, instrument);
            // compare octave
            if (keyA[1] > keyB[1]) {
                return 1;
            } else if (keyA[1] < keyB[1]) {
                return -1;
            }
            // compare pitch
            else if (keyA[0] > keyB[0]) {
                return 1;
            } else if (keyA[0] < keyB[0]) {
                return -1;
            } else {
                return 0;
            }
        });

        // remove duplicate values from array
        let uniquePitchArray = [];
        $.each(pitchArray, function(i, el) {
            if ($.inArray(el, uniquePitchArray) === -1)
                uniquePitchArray.push(el);
        });

        // assign the now unique array back to the original array
        pitchArray = uniquePitchArray.slice();

        // find the guild wars 2 octave
        currentNoteOctave = [];
        for (let i = 0; i < pitchArray.length; i++) {
            currentNoteOctave[i] = getOctaveFromPitch(pitchArray[i], instrument);
            if (currentNoteOctave[i] == -1) {
                return ""
            }
        }

        // find the direction
        let direction = findDirection(currentNoteOctave, previousNoteOctave);

        return_array[0] = [];
        return_array[1] = [];
        // get the key to be pressed with the up direction
        if (direction == "up") {
            for (let i = 0; i < pitchArray.length; i++) {
                if (previousNoteOctave > currentNoteOctave[i]) {
                    return_array[1][i] = Math.ceil(currentNoteOctave[i]);
                } else {
                    return_array[1][i] = Math.floor(currentNoteOctave[i]);
                }
                return_array[0][i] = getKeyFromPitch(pitchArray[i], return_array[1][i], instrument);
                if (return_array[0][i] == "false") {
                    return "";
                }
            }
        }
        // get the key to be pressed with the down direction and reverse the array
        else if (direction == "down") {
            let j = 0;
            for (let i = pitchArray.length - 1; i >= 0; i--) {
                if (previousNoteOctave < currentNoteOctave[i]) {
                    return_array[1][j] = Math.floor(currentNoteOctave[i]);
                } else {
                    return_array[1][j] = Math.ceil(currentNoteOctave[i]);
                }
                return_array[0][j] = getKeyFromPitch(pitchArray[i], return_array[1][j], instrument);
                if (return_array[0][j] == "false") {
                    return "";
                }
                j++;
            }
        }
        // if this is reached it means the chord is only in a single octave. 
        // default direction of play in this case is up
        else {
            for (let i = 0; i < pitchArray.length; i++) {
                return_array[1][i] = parseInt(direction);
                return_array[0][i] = getKeyFromPitch(pitchArray[i], return_array[1][i], instrument);
                if (return_array[0][i] == "false") {
                    return "";
                }
            }
        }
    }
    // if there is a single pitch assign it to the return value
    else {
        //check syntax and return error if bad syntax
        if (checkPitchSyntax(pitch) == false) {
            return "";
        }

        // find the octave
        currentNoteOctave = getOctaveFromPitch(pitch, instrument);
        if (currentNoteOctave == -1) {
            return "";
        }

        if ((currentNoteOctave % 1) != 0) {
            if (Math.ceil(currentNoteOctave) <= previousNoteOctave) {
                return_array[1] = Math.ceil(currentNoteOctave);

            } else if (Math.floor(currentNoteOctave) >= previousNoteOctave) {
                return_array[1] = Math.floor(currentNoteOctave);
            }
        } else {
            return_array[1] = currentNoteOctave;
        }

        // find the key to press
        return_array[0] = getKeyFromPitch(pitch, return_array[1], instrument);
        if (return_array[0] == "false") {
            return "";
        }
    }

    return return_array;
}

// construct and return the manual script given the notes, instrument, and song
// title
function constructManualScript(notes, instrument, title) {
    let outputString;
    let keyOctavePair;
    let abcPitch;
    let currentKeyValue;
    let previousNoteOctave = 1;
    let currentNoteOctave;
    let instrument_stripped = instrument.replace("", "").replace("/", "");
    let i;
    let j;

    //add the header information to the song
    outputString = "Title: " + title + "\n\nInstrument: " + instrument_stripped.charAt(0).toUpperCase() + instrument_stripped.slice(1) + "\n\n";

    for (i = 0; i < notes.length; i++) {
        //strip the note length
        abcPitch = stripchars(notes[i], "/1234567890");

        // parse the pitch
        keyOctavePair = getKeyOctaveFromPitch(abcPitch, previousNoteOctave, instrument);

        // check for errors
        if (keyOctavePair == "") {
            if (typeof console != "undefined") {
                console.log(abcPitch);
            }
            return "";
        }

        // assign the letiables from the keyoctavepair
        currentKeyValue = keyOctavePair[0];
        currentNoteOctave = keyOctavePair[1];

        // if the pitch is a chord
        if (currentKeyValue instanceof Array) {
            // if necessary change the octave prior to starting the chord
            if (currentNoteOctave[0] < previousNoteOctave) {
                outputString += "\u25BC ";
                if (Math.abs(currentNoteOctave[0] - previousNoteOctave) > 1) {
                    outputString += "\u25BC ";
                }
            } else if (currentNoteOctave[0] > previousNoteOctave) {
                outputString += "\u25B2 ";
                if (Math.abs(currentNoteOctave[0] - previousNoteOctave) > 1) {
                    outputString += "\u25B2 ";
                }
            }
            previousNoteOctave = currentNoteOctave[0];
            outputString += "{";
            for (j = 0; j < currentKeyValue.length; j++) {
                if (currentNoteOctave[j] < previousNoteOctave) {
                    outputString += "\u25BC";
                    if (Math.abs(currentNoteOctave[j] - previousNoteOctave) > 1) {
                        outputString += "\u25BC";
                    }
                } else if (currentNoteOctave[j] > previousNoteOctave) {
                    outputString += "\u25B2";
                    if (Math.abs(currentNoteOctave[j] - previousNoteOctave) > 1) {
                        outputString += "\u25B2";
                    }
                }
                previousNoteOctave = currentNoteOctave[j];
                outputString += currentKeyValue[j].replace(/{Numpad|}| down/g, "");
            }
            outputString += "} ";
        }
        // if not a chord
        else {
            if (currentNoteOctave < previousNoteOctave) {
                outputString += "\u25BC ";
                if (Math.abs(currentNoteOctave - previousNoteOctave) > 1 && (instrument == "/harp" || instrument == "/lute" || instrument == "/redbell")) {
                    outputString += "\u25BC ";
                }
            } else if (currentNoteOctave > previousNoteOctave) {
                outputString += "\u25B2 ";
                if (Math.abs(currentNoteOctave - previousNoteOctave) > 1 && (instrument == "/harp" || instrument == "/lute" || instrument == "/redbell")) {
                    outputString += "\u25B2 ";
                }
            }

            // send the key press for the next note
            if (currentKeyValue != "") {
                outputString += currentKeyValue.replace(/{Numpad|}| down/g, "") + " ";
            }

            //set the previous octave to the current for the next iteration
            previousNoteOctave = currentNoteOctave;
        }
    }

    outputString += "\n\nCreated using http://gw2mb.com";

    // remove useless octave changes
    outputString = outputString.replace(/(\u25B2 \u25BC )|(\u25BC \u25B2 )/g, "");

    //return the finished autohotkey script
    return outputString.trim();
}

// this function returns the amount of time to sleep. the sleep durations are
// needed to make multioctave chords and double octave changes consistent
function getCurrentDelay(keyOctavePairArray, previousNoteOctave, currentNoteOctave) {
    let startNotes = [];
    let endNotes = [];
    let keyValueArray = keyOctavePairArray[0];
    let noteOctaveArray = keyOctavePairArray[1];
    let found = false;

    if (currentNoteOctave == 2) {
        // create an array composed of all key presses in the previous octave
        for (let i = 0; i < noteOctaveArray.length; i++) {
            if (1 == noteOctaveArray[i] || 0 == noteOctaveArray[i]) {
                startNotes.push(keyValueArray[i]);
                found = true;
            }
        }
    } else if (currentNoteOctave == 0) {
        // create an array composed of all key presses in the previous octave
        for (let i = 0; i < noteOctaveArray.length; i++) {
            if (1 == noteOctaveArray[i] || 2 == noteOctaveArray[i]) {
                startNotes.push(keyValueArray[i]);
                found = true;
            }
        }
    } else {
        // create an array composed of all key presses in the previous octave
        for (let i = 0; i < noteOctaveArray.length; i++) {
            if (previousNoteOctave == noteOctaveArray[i]) {
                startNotes.push(keyValueArray[i]);
                found = true;
            }
        }
    }

    // if there are no notes in the previousOctave then we do not need a delay
    if (found == false) {
        return 0;
    }

    if (currentNoteOctave == 2) {
        if (getCurrentDelay(keyOctavePairArray, 0, 1) == 75 && getCurrentDelay(keyOctavePairArray, 2, 1) == 0) {
            return 0;
        }
    } else if (currentNoteOctave == 0) {
        if (getCurrentDelay(keyOctavePairArray, 2, 1) == 75 && getCurrentDelay(keyOctavePairArray, 0, 1) == 0) {
            return 0;
        }
    }

    // reset the letiable for the creation of the endNotes array
    found = false;

    // create an array composed of all key presses in the current octave
    for (let i = 0; i < noteOctaveArray.length; i++) {
        if (currentNoteOctave == noteOctaveArray[i]) {
            endNotes.push(keyValueArray[i]);
            found = true;
        }
    }

    // if there are no notes in the previousOctave then we do not need a delay
    if (found == false) {
        return 0;
    }

    for (let i = 0; i < startNotes.length; i++) {
        for (let j = 0; j < endNotes.length; j++) {
            if (startNotes[i] == endNotes[j]) {
                return 75;
            }
        }
    }

    return 0;
}

function constructAutoScript(notes, instrument, meter, tempo) {
    let outputString = "";
    let keyOctavePair;
    let abcPitch;
    let currentKeyValue;
    let previousKeyValue = "";
    let previousNoteOctave = 1;
    let currentNoteOctave;
    let finalNoteLength;
    let noteLength;
    let sleepDelay;
    let currentDelay;
    let i;
    let j;
    let k;

    //make sure the lute is in the center octave
    if (instrument == "/lute") {
        outputString = "SendInput {Numpad0}\nSleep, 250\nSendInput {Numpad0}\nSleep, 250\nSendInput {Numpad0}\nSleep, 250\nSendInput {Numpad9}\nSleep, 250\n";
    }

    for (i = 0; i < notes.length; i++) {
        //parse the note and initialize the letiables
        abcPitch = stripchars(notes[i], "/1234567890");

        keyOctavePair = getKeyOctaveFromPitch(abcPitch, previousNoteOctave, instrument);

        // check for errors from getkeyoctavefrompitch
        if (keyOctavePair == "") {
            if (typeof console != "undefined") {
                console.log(abcPitch);
            }
            return "";
        }

        currentKeyValue = keyOctavePair[0];
        currentNoteOctave = keyOctavePair[1];
        noteLength = getDelayFromNoteLength(stripchars(notes[i], "abcdefgzABCDEFGZ\\[\\],'"), meter, tempo);

        // check results of getdelayfromnotelength
        if (noteLength == "") {
            if (typeof console != "undefined") {
                console.log(notes[i]);
            }
            return "";
        }

        sleepDelay = 0;
        currentDelay = 0;

        // if the pitch is a chord
        if (currentKeyValue instanceof Array) {
            // send the key up for the last note played
            if (previousKeyValue instanceof Array) {
                for (let l = 0; l < previousKeyValue.length; l++) {
                    outputString += "SendInput " + previousKeyValue[l].replace("down", "up") + "\n";
                }
            } else if (previousKeyValue != "") {
                outputString += "SendInput " + previousKeyValue.replace("down", "up") + "\n";
            }

            // set k to zero
            k = 0;
            // set the previousKeyValue to an array
            previousKeyValue = [];

            // send the input for an octave change prior to beginning the chord
            if (currentNoteOctave[0] < previousNoteOctave) {
                outputString += "SendInput {Numpad0}\n";
                if (Math.abs(currentNoteOctave[0] - previousNoteOctave) > 1) {
                    outputString += "Sleep, 40\nSendInput {Numpad0}\n";
                    sleepDelay += 40;
                }
            } else if (currentNoteOctave[0] > previousNoteOctave) {
                outputString += "SendInput {Numpad9}\n";
                if (Math.abs(currentNoteOctave[0] - previousNoteOctave) > 1) {
                    outputString += "Sleep, 40\nSendInput {Numpad9}\n";
                    sleepDelay += 40;
                }
            }
            previousNoteOctave = currentNoteOctave[0];
            // iterate through all the notes in the chord
            for (j = 0; j < currentKeyValue.length; j++) {
                //send input for any octave changes
                if (currentNoteOctave[j] < previousNoteOctave) {
                    // send the key up for the last note played
                    for (let l = 0; l < previousKeyValue.length; l++) {
                        outputString += "SendInput " + previousKeyValue[l].replace("down", "up") + "\n";
                    }

                    // reset the previousKeyValue
                    previousKeyValue = [];
                    k = 0;
                    // check to see if the next octave contains a matching key value
                    // to the current octave
                    currentDelay = getCurrentDelay(keyOctavePair, previousNoteOctave, previousNoteOctave - 1);
                    if (currentDelay != 0) {
                        outputString += "Sleep, " + currentDelay + "\n";
                        sleepDelay += currentDelay;
                    }
                    outputString += "SendInput {Numpad0}\n";
                    if (Math.abs(currentNoteOctave[j] - previousNoteOctave) > 1) {
                        // check to see if the next octave contains a matching key value
                        // to the current octave
                        currentDelay = getCurrentDelay(keyOctavePair, 2, 0);
                        if (currentDelay != 0) {
                            outputString += "Sleep, " + currentDelay + "\n";
                            sleepDelay += currentDelay;
                        } else {
                            outputString += "Sleep, 40\n";
                            sleepDelay += 40;
                        }
                        outputString += "SendInput {Numpad0}\n";
                    }
                } else if (currentNoteOctave[j] > previousNoteOctave) {
                    // send the key up for the last note played
                    for (let l = 0; l < previousKeyValue.length; l++) {
                        outputString += "SendInput " + previousKeyValue[l].replace("down", "up") + "\n";
                    }

                    // reset the previousKeyValue
                    previousKeyValue = [];
                    k = 0;
                    // check to see if the next octave contains a matching key value
                    // to the current octave
                    currentDelay = getCurrentDelay(keyOctavePair, previousNoteOctave, previousNoteOctave + 1);
                    if (currentDelay != 0) {
                        outputString += "Sleep, " + currentDelay + "\n";
                        sleepDelay += currentDelay;
                    }
                    outputString += "SendInput {Numpad9}\n";
                    if (Math.abs(currentNoteOctave[j] - previousNoteOctave) > 1) {
                        // check to see if the next octave contains a matching key value
                        // to the current octave
                        currentDelay = getCurrentDelay(keyOctavePair, 0, 2);
                        if (currentDelay != 0) {
                            outputString += "Sleep, " + currentDelay + "\n";
                            sleepDelay += currentDelay;
                        } else {
                            outputString += "Sleep, 40\n";
                            sleepDelay += 40;
                        }
                        outputString += "SendInput {Numpad9}\n";
                    }
                }
                // send the note
                outputString += "SendInput " + currentKeyValue[j] + "\n";
                previousKeyValue[k++] = currentKeyValue[j];
                //set the previous octave to the current for the next iteration
                previousNoteOctave = currentNoteOctave[j];
            }
        } else {
            // send the key up for the last note played
            if (previousKeyValue instanceof Array) {
                for (j = 0; j < previousKeyValue.length; j++) {
                    outputString += "SendInput " + previousKeyValue[j].replace("down", "up") + "\n";
                }
            } else if (previousKeyValue != "") {
                if (previousKeyValue == currentKeyValue && instrument == "/horn") {
                    outputString += "SendInput {Esc}\n";
                }
                outputString += "SendInput " + previousKeyValue.replace("down", "up") + "\n";
            }

            //send input for any octave changes
            if (currentNoteOctave < previousNoteOctave) {
                outputString += "SendInput {Numpad0}\n";
                if (Math.abs(currentNoteOctave - previousNoteOctave) > 1 && (instrument == "/harp" || instrument == "/lute" || instrument == "/redbell")) {
                    outputString += "Sleep, 40\nSendInput {Numpad0}\n";
                    sleepDelay += 40;
                }
            } else if (currentNoteOctave > previousNoteOctave) {
                if (instrument == "/flute") {
                    outputString += "SendInput {Numpad0}\n";
                } else {
                    outputString += "SendInput {Numpad9}\n";
                    if (Math.abs(currentNoteOctave - previousNoteOctave) > 1 && (instrument == "/harp" || instrument == "/lute" || instrument == "/redbell")) {
                        outputString += "Sleep, 40\nSendInput {Numpad9}\n";
                        sleepDelay += 40;
                    }
                }
            }

            // send the key press for the next note
            if (currentKeyValue != "") {
                outputString += "SendInput " + currentKeyValue + "\n";
            } else if (instrument == "/flute") {
                outputString += "SendInput {Numpad9}\n";
            }

            //set the previous octave to the current for the next iteration
            previousNoteOctave = currentNoteOctave;

            //set the previous key down action for the horn
            previousKeyValue = currentKeyValue;
        }

        finalNoteLength = noteLength - sleepDelay;

        if (finalNoteLength < 0) {
            finalNoteLength = 0;
        }

        outputString += "Sleep, " + finalNoteLength + "\n";
    }

    //stop the last note if flute or horn
    if (instrument == "/flute") {
        outputString += "SendInput " + previousKeyValue.replace("down", "up") + "\n";
        outputString += "SendInput {Numpad9}\n";
    } else {
        if (previousKeyValue instanceof Array) {
            for (let l = 0; l < previousKeyValue.length; l++) {
                outputString += "SendInput " + previousKeyValue[l].replace("down", "up") + "\n";
            }
        } else if (previousKeyValue != "") {
            outputString += "SendInput " + previousKeyValue.replace("down", "up") + "\n";
        }
    }

    //return the finished autohotkey script
    return outputString.trim();
}

const giveMeSpace = () => {
    let textArea = $('#songarea').val();
    $('#songarea').val(textArea + ' ');
};

/******************************************************************************/
/* Functions Executed on Page Load                                            */
/******************************************************************************/

let resetInterval;

$(document).ready(function() {
    document.getElementById(instrument).style.filter = "none";
    if (instrument == "flute" || instrument == "redbell" || instrument == "bass") {
        console.log(instrument);
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

    document.addEventListener('keydown', function(event) {
        if (event.which == 112) window.location.replace('./intro.html?instrument=harp');
        if (event.which == 113) window.location.replace('./intro.html?instrument=bell');
        if (event.which == 114) window.location.replace('./intro.html?instrument=redbell');
        if (event.which == 115) window.location.replace('./intro.html?instrument=bass');
        if (event.which == 116) window.location.replace('./intro.html?instrument=lute');
        if (event.which == 117) window.location.replace('./intro.html?instrument=horn');
        if (event.which == 118) window.location.replace('./intro.html?instrument=flute');

        if (instrument == "flute" || instrument == "horn" || instrument == "bass") {
            let reset = () => {
                if (!currentAudio.loop) {
                    currentAudio.volume = 0;
                    currentAudio = null;
                } else setTimeout(reset(), currentAudio.duration);
            };
            // setTimeout(reset(), currentAudio.duration);
            currentAudio.loop = true;
            console.log(currentAudio.duration);
        }

        $("#songarea").focus();
        if (event.which == 49 || event.which == 97) {
            if (!fired1) {
                fired1 = true;
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
            if (!fired9) {
                fired9 = true;
                octave_down();
            }
            event.preventDefault();
            event.stopPropagation();
            return false;
        } else if (event.which == 48 || event.which == 96) {
            if (instrument == "flute" || instrument == "horn") {
                fadeoutAudio(currentAudio);
            }
            if (!fired0) {
                fired0 = true;
                octave_up();
            }
            event.preventDefault();
            event.stopPropagation();
            return false;
        }

    });

    document.addEventListener('keyup', function(event) {
        if (instrument == "flute" || instrument == "horn" || instrument == "bass") {
            currentAudio.loop = false;
            if (instrument == "flute" || instrument == "horn") {
                fadeoutAudio(currentAudio);
            }
        }
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
            giveMeSpace();
            fired1 = false;
            changecssproperty(document.getElementById("skill1"), shadowprop, '', 'remove');
            if (instrument == "flute" || instrument == "horn") {
                if (getSoundFileFromSkillId("skill1") == currentAudio.src) {
                    fadeoutAudio(currentAudio);
                }
            }
            // focus on the text area to make the cursor appear
            $("#songarea").focus();
        } else if (event.which == 50 || event.which == 98) {
            giveMeSpace();
            fired2 = false;
            changecssproperty(document.getElementById("skill2"), shadowprop, '', 'remove');
            if (instrument == "flute" || instrument == "horn") {
                if (getSoundFileFromSkillId("skill2") == currentAudio.src) {
                    fadeoutAudio(currentAudio);
                }
            }
            // focus on the text area to make the cursor appear
            $("#songarea").focus();
        } else if (event.which == 51 || event.which == 99) {
            giveMeSpace();
            fired3 = false;
            changecssproperty(document.getElementById("skill3"), shadowprop, '', 'remove');
            if (instrument == "flute" || instrument == "horn") {
                if (getSoundFileFromSkillId("skill3") == currentAudio.src) {
                    fadeoutAudio(currentAudio);
                }
            }
            // focus on the text area to make the cursor appear
            $("#songarea").focus();
        } else if (event.which == 52 || event.which == 100) {
            giveMeSpace();
            fired4 = false;
            changecssproperty(document.getElementById("skill4"), shadowprop, '', 'remove');
            if (instrument == "flute" || instrument == "horn") {
                if (getSoundFileFromSkillId("skill4") == currentAudio.src) {
                    fadeoutAudio(currentAudio);
                }
            }
            // focus on the text area to make the cursor appear
            $("#songarea").focus();
        } else if (event.which == 53 || event.which == 101) {
            giveMeSpace();
            fired5 = false;
            changecssproperty(document.getElementById("skill5"), shadowprop, '', 'remove');
            if (instrument == "flute" || instrument == "horn") {
                if (getSoundFileFromSkillId("skill5") == currentAudio.src) {
                    fadeoutAudio(currentAudio);
                }
            }
            // focus on the text area to make the cursor appear
            $("#songarea").focus();
        } else if (event.which == 54 || event.which == 102) {
            giveMeSpace();
            fired6 = false;
            changecssproperty(document.getElementById("skill6"), shadowprop, '', 'remove');
            if (instrument == "flute" || instrument == "horn") {
                if (getSoundFileFromSkillId("skill6") == currentAudio.src) {
                    fadeoutAudio(currentAudio);
                }
            }
            // focus on the text area to make the cursor appear
            $("#songarea").focus();
        } else if (event.which == 55 || event.which == 103) {
            giveMeSpace();
            fired7 = false;
            changecssproperty(document.getElementById("skill7"), shadowprop, '', 'remove');
            if (instrument == "flute" || instrument == "horn") {
                if (getSoundFileFromSkillId("skill7") == currentAudio.src) {
                    fadeoutAudio(currentAudio);
                }
            }
            // focus on the text area to make the cursor appear
            $("#songarea").focus();
        } else if (event.which == 56 || event.which == 104) {
            giveMeSpace();
            fired8 = false;
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
        }

    });
});