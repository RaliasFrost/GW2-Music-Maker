/******************************************************************************/
/* Global Variables                                                           */
/******************************************************************************/

// the current octave of the instrument
var currentOctave = 1;
var note = 'Hi';
// this holds the currently playing audio file. this is necessary for fadeing
// notes out
var currentAudio = new Audio();
// used to stop playback
var stopPlayback = false;
// used to show that a song is currently playing back
var nowPlaying = false;
// the song id of the currently playing song. used to stop playback for the
// current song on the archive page
var nowPlayingID = 0;
// used to remember which song to add a comment to
var commentSongID = 0;
// recording (1) or not recording (0)
var combatMode = 1;
// chord mode off (0) chord mode on (1)
var chordMode = 0;
// the notes in the current chord
var chordArray = [];
// the tempo, meter, and volume of the current song
var global_tempo = 90;
var global_meter = 4;
var global_volume = 50;
// numerator and denominator of the note length multiplier
var numerator = 1;
var denominator = 1;
// hotkeys off = false hotkeys on = true
var hotkeys = true;
// properties to test for shadow
var shadowprop = getsupportedprop(['boxShadow',
    'mozBoxShadow',
    'webkitBoxShadow'
]);
// properties to test for transforming
var transformprop = getsupportedprop(['webkitTransform',
    'mozTransform',
    'msTransform',
    'oTransform',
    'transform'
]);
// this is the shadow property used when a key is pressed
var shadowvalue = '0 0 15px 10px #000000 inset';
// these are the rotate values for when changing octaves
var transformvalue1 = 'rotateX(90deg)';
var transformvalue2 = 'rotateX(0deg)';
// this global variable is used to stop double posts when the add comment button
// is clicked twice
var addCommentClicked = false;

/******************************************************************************/
/* Functions                                                                  */
/******************************************************************************/

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
            var keyA = getKeyOctaveFromPitch(a, 0, location.pathname);
            var keyB = getKeyOctaveFromPitch(b, 0, location.pathname);
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
    var index = this.indexOf(element);
    if (index > -1) {
        this.splice(index, 1);
    }
};

// Reduce a fraction by finding the Greatest Common Divisor and dividing by it.
function reduce(num, den) {
    var gcd = function gcd(a, b) {
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
    var a = document.createElement('audio');
    var ogg = !!(a.canPlayType && a.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, ''));
    if (ogg)
        return '.ogg';
    var mp3 = !!(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, ''));
    if (mp3)
        return '.mp3';
    else
        return 0;
}

// fetch the comments for the given song with ajax
function get_comments(song_id) {
    $.ajax({
        type: "POST",
        url: "sql/get_comments.php",
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
    var root = document.documentElement; //reference root element of document
    for (var i = 0; i < proparray.length; i++) { //loop through possible properties
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
    var win = window.open(url, '_blank');
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
    var return_soundfile;
    if (currentOctave == 0) {
        /*if (location.pathname == "/bell.php") {
            switch (skill_id) {
                case "skill1":
                    return_soundfile = "http://gw2mb.com/sound/bell/D4";
                    break;
                case "skill2":
                    return_soundfile = "http://gw2mb.com/sound/bell/E4";
                    break;
                case "skill3":
                    return_soundfile = "http://gw2mb.com/sound/bell/F4";
                    break;
                case "skill4":
                    return_soundfile = "http://gw2mb.com/sound/bell/G4";
                    break;
                case "skill5":
                    return_soundfile = "http://gw2mb.com/sound/bell/A4";
                    break;
                case "skill6":
                    return_soundfile = "http://gw2mb.com/sound/bell/B4";
                    break;
                case "skill7":
                    return_soundfile = "http://gw2mb.com/sound/bell/C5";
                    break;
                case "skill8":
                    return_soundfile = "http://gw2mb.com/sound/bell/D5";
                    break;
            }
        } else if (location.pathname == "/flute.php") {
            //there is no bottom octave for flute
        } else if (location.pathname == "/horn.php") {
            switch (skill_id) {
                case "skill1":
                    return_soundfile = "http://gw2mb.com/sound/horn/E3";
                    break;
                case "skill2":
                    return_soundfile = "http://gw2mb.com/sound/horn/F3";
                    break;
                case "skill3":
                    return_soundfile = "http://gw2mb.com/sound/horn/G3";
                    break;
                case "skill4":
                    return_soundfile = "http://gw2mb.com/sound/horn/A3";
                    break;
                case "skill5":
                    return_soundfile = "http://gw2mb.com/sound/horn/B3";
                    break;
                case "skill6":
                    return_soundfile = "http://gw2mb.com/sound/horn/C4";
                    break;
                case "skill7":
                    return_soundfile = "http://gw2mb.com/sound/horn/D4";
                    break;
                case "skill8":
                    return_soundfile = "http://gw2mb.com/sound/horn/E4";
                    break;
            }
        } else {*/
        switch (skill_id) {
            case "skill1":
                return_soundfile = "http://gw2mb.com/sound/harp/C3";
                break;
            case "skill2":
                return_soundfile = "http://gw2mb.com/sound/harp/D3";
                break;
            case "skill3":
                return_soundfile = "http://gw2mb.com/sound/harp/E3";
                break;
            case "skill4":
                return_soundfile = "http://gw2mb.com/sound/harp/F3";
                break;
            case "skill5":
                return_soundfile = "http://gw2mb.com/sound/harp/G3";
                break;
            case "skill6":
                return_soundfile = "http://gw2mb.com/sound/harp/A3";
                break;
            case "skill7":
                return_soundfile = "http://gw2mb.com/sound/harp/B3";
                break;
            case "skill8":
                return_soundfile = "http://gw2mb.com/sound/harp/C4";
                break;
        }
        /*}
        if (location.pathname == "/lute.php") {
            switch (skill_id) {
                case "skill1":
                    return_soundfile = "http://gw2mb.com/sound/lute/C3";
                    break;
                case "skill2":
                    return_soundfile = "http://gw2mb.com/sound/lute/D3";
                    break;
                case "skill3":
                    return_soundfile = "http://gw2mb.com/sound/lute/E3";
                    break;
                case "skill4":
                    return_soundfile = "http://gw2mb.com/sound/lute/F3";
                    break;
                case "skill5":
                    return_soundfile = "http://gw2mb.com/sound/lute/G3";
                    break;
                case "skill6":
                    return_soundfile = "http://gw2mb.com/sound/lute/A3";
                    break;
                case "skill7":
                    return_soundfile = "http://gw2mb.com/sound/lute/B3";
                    break;
                case "skill8":
                    return_soundfile = "http://gw2mb.com/sound/lute/C4";
                    break;
            }
        } else if (location.pathname == "/bell2.php") {
            //there is no bottom octave for bell2
        } else if (location.pathname == "/bass.php") {
            //there is no bottom octave for bass
        }*/
    } else if (currentOctave == 1) {
        /*if (location.pathname == "/bell.php") {
            switch (skill_id) {
                case "skill1":
                    return_soundfile = "http://gw2mb.com/sound/bell/D5";
                    break;
                case "skill2":
                    return_soundfile = "http://gw2mb.com/sound/bell/E5";
                    break;
                case "skill3":
                    return_soundfile = "http://gw2mb.com/sound/bell/F5";
                    break;
                case "skill4":
                    return_soundfile = "http://gw2mb.com/sound/bell/G5";
                    break;
                case "skill5":
                    return_soundfile = "http://gw2mb.com/sound/bell/A5";
                    break;
                case "skill6":
                    return_soundfile = "http://gw2mb.com/sound/bell/B5";
                    break;
                case "skill7":
                    return_soundfile = "http://gw2mb.com/sound/bell/C6";
                    break;
                case "skill8":
                    return_soundfile = "http://gw2mb.com/sound/bell/D6";
                    break;
            }
        } else if (location.pathname == "/flute.php") {
            switch (skill_id) {
                case "skill1":
                    return_soundfile = "http://gw2mb.com/sound/flute/E4";
                    break;
                case "skill2":
                    return_soundfile = "http://gw2mb.com/sound/flute/F4";
                    break;
                case "skill3":
                    return_soundfile = "http://gw2mb.com/sound/flute/G4";
                    break;
                case "skill4":
                    return_soundfile = "http://gw2mb.com/sound/flute/A4";
                    break;
                case "skill5":
                    return_soundfile = "http://gw2mb.com/sound/flute/B4";
                    break;
                case "skill6":
                    return_soundfile = "http://gw2mb.com/sound/flute/C5";
                    break;
                case "skill7":
                    return_soundfile = "http://gw2mb.com/sound/flute/D5";
                    break;
                case "skill8":
                    return_soundfile = "http://gw2mb.com/sound/flute/E5";
                    break;
            }
        } else if (location.pathname == "/horn.php") {
            switch (skill_id) {
                case "skill1":
                    return_soundfile = "http://gw2mb.com/sound/horn/E4";
                    break;
                case "skill2":
                    return_soundfile = "http://gw2mb.com/sound/horn/F4";
                    break;
                case "skill3":
                    return_soundfile = "http://gw2mb.com/sound/horn/G4";
                    break;
                case "skill4":
                    return_soundfile = "http://gw2mb.com/sound/horn/A4";
                    break;
                case "skill5":
                    return_soundfile = "http://gw2mb.com/sound/horn/B4";
                    break;
                case "skill6":
                    return_soundfile = "http://gw2mb.com/sound/horn/C5";
                    break;
                case "skill7":
                    return_soundfile = "http://gw2mb.com/sound/horn/D5";
                    break;
                case "skill8":
                    return_soundfile = "http://gw2mb.com/sound/horn/E5";
                    break;
            }
        } else if (location.pathname == "/harp.php") {*/
        switch (skill_id) {
            case "skill1":
                return_soundfile = "http://gw2mb.com/sound/harp/C4";
                break;
            case "skill2":
                return_soundfile = "http://gw2mb.com/sound/harp/D4";
                break;
            case "skill3":
                return_soundfile = "http://gw2mb.com/sound/harp/E4";
                break;
            case "skill4":
                return_soundfile = "http://gw2mb.com/sound/harp/F4";
                break;
            case "skill5":
                return_soundfile = "http://gw2mb.com/sound/harp/G4";
                break;
            case "skill6":
                return_soundfile = "http://gw2mb.com/sound/harp/A4";
                break;
            case "skill7":
                return_soundfile = "http://gw2mb.com/sound/harp/B4";
                break;
            case "skill8":
                return_soundfile = "http://gw2mb.com/sound/harp/C5";
                break;
        }
        /*} else if (location.pathname == "/lute.php") {
            switch (skill_id) {
                case "skill1":
                    return_soundfile = "http://gw2mb.com/sound/lute/C4";
                    break;
                case "skill2":
                    return_soundfile = "http://gw2mb.com/sound/lute/D4";
                    break;
                case "skill3":
                    return_soundfile = "http://gw2mb.com/sound/lute/E4";
                    break;
                case "skill4":
                    return_soundfile = "http://gw2mb.com/sound/lute/F4";
                    break;
                case "skill5":
                    return_soundfile = "http://gw2mb.com/sound/lute/G4";
                    break;
                case "skill6":
                    return_soundfile = "http://gw2mb.com/sound/lute/A4";
                    break;
                case "skill7":
                    return_soundfile = "http://gw2mb.com/sound/lute/B4";
                    break;
                case "skill8":
                    return_soundfile = "http://gw2mb.com/sound/lute/C5";
                    break;
            }
        } else if (location.pathname == "/bell2.php") {
            switch (skill_id) {
                case "skill1":
                    return_soundfile = "http://gw2mb.com/sound/bell2/C5";
                    break;
                case "skill2":
                    return_soundfile = "http://gw2mb.com/sound/bell2/D5";
                    break;
                case "skill3":
                    return_soundfile = "http://gw2mb.com/sound/bell2/E5";
                    break;
                case "skill4":
                    return_soundfile = "http://gw2mb.com/sound/bell2/F5";
                    break;
                case "skill5":
                    return_soundfile = "http://gw2mb.com/sound/bell2/G5";
                    break;
                case "skill6":
                    return_soundfile = "http://gw2mb.com/sound/bell2/A5";
                    break;
                case "skill7":
                    return_soundfile = "http://gw2mb.com/sound/bell2/B5";
                    break;
                case "skill8":
                    return_soundfile = "http://gw2mb.com/sound/bell2/C6";
                    break;
            }
        } else if (location.pathname == "/bass.php") {
            switch (skill_id) {
                case "skill1":
                    return_soundfile = "http://gw2mb.com/sound/bass/C1";
                    break;
                case "skill2":
                    return_soundfile = "http://gw2mb.com/sound/bass/D1";
                    break;
                case "skill3":
                    return_soundfile = "http://gw2mb.com/sound/bass/E1";
                    break;
                case "skill4":
                    return_soundfile = "http://gw2mb.com/sound/bass/F1";
                    break;
                case "skill5":
                    return_soundfile = "http://gw2mb.com/sound/bass/G1";
                    break;
                case "skill6":
                    return_soundfile = "http://gw2mb.com/sound/bass/A1";
                    break;
                case "skill7":
                    return_soundfile = "http://gw2mb.com/sound/bass/B1";
                    break;
                case "skill8":
                    return_soundfile = "http://gw2mb.com/sound/bass/C2";
                    break;
            }
        }*/
    } else if (currentOctave == 2) {
        /*if (location.pathname == "/bell.php") {
            switch (skill_id) {
                case "skill1":
                    return_soundfile = "http://gw2mb.com/sound/bell/D6";
                    break;
                case "skill2":
                    return_soundfile = "http://gw2mb.com/sound/bell/E6";
                    break;
                case "skill3":
                    return_soundfile = "http://gw2mb.com/sound/bell/F6";
                    break;
                case "skill4":
                    return_soundfile = "http://gw2mb.com/sound/bell/G6";
                    break;
                case "skill5":
                    return_soundfile = "http://gw2mb.com/sound/bell/A6";
                    break;
                case "skill6":
                    return_soundfile = "http://gw2mb.com/sound/bell/B6";
                    break;
                case "skill7":
                    return_soundfile = "http://gw2mb.com/sound/bell/C7";
                    break;
                case "skill8":
                    return_soundfile = "http://gw2mb.com/sound/bell/D7";
                    break;
            }
        } else if (location.pathname == "/flute.php") {
            switch (skill_id) {
                case "skill1":
                    return_soundfile = "http://gw2mb.com/sound/flute/E5";
                    break;
                case "skill2":
                    return_soundfile = "http://gw2mb.com/sound/flute/F5";
                    break;
                case "skill3":
                    return_soundfile = "http://gw2mb.com/sound/flute/G5";
                    break;
                case "skill4":
                    return_soundfile = "http://gw2mb.com/sound/flute/A5";
                    break;
                case "skill5":
                    return_soundfile = "http://gw2mb.com/sound/flute/B5";
                    break;
                case "skill6":
                    return_soundfile = "http://gw2mb.com/sound/flute/C6";
                    break;
                case "skill7":
                    return_soundfile = "http://gw2mb.com/sound/flute/D6";
                    break;
                case "skill8":
                    return_soundfile = "http://gw2mb.com/sound/flute/E6";
                    break;
            }
        } else if (location.pathname == "/horn.php") {
            switch (skill_id) {
                case "skill1":
                    return_soundfile = "http://gw2mb.com/sound/horn/E5";
                    break;
                case "skill2":
                    return_soundfile = "http://gw2mb.com/sound/horn/F5";
                    break;
                case "skill3":
                    return_soundfile = "http://gw2mb.com/sound/horn/G5";
                    break;
                case "skill4":
                    return_soundfile = "http://gw2mb.com/sound/horn/A5";
                    break;
                case "skill5":
                    return_soundfile = "http://gw2mb.com/sound/horn/B5";
                    break;
                case "skill6":
                    return_soundfile = "http://gw2mb.com/sound/horn/C6";
                    break;
                case "skill7":
                    return_soundfile = "http://gw2mb.com/sound/horn/D6";
                    break;
                case "skill8":
                    return_soundfile = "http://gw2mb.com/sound/horn/E6";
                    break;
            }
        } else if (location.pathname == "/harp.php") {*/
        switch (skill_id) {
            case "skill1":
                return_soundfile = "http://gw2mb.com/sound/harp/C5";
                break;
            case "skill2":
                return_soundfile = "http://gw2mb.com/sound/harp/D5";
                break;
            case "skill3":
                return_soundfile = "http://gw2mb.com/sound/harp/E5";
                break;
            case "skill4":
                return_soundfile = "http://gw2mb.com/sound/harp/F5";
                break;
            case "skill5":
                return_soundfile = "http://gw2mb.com/sound/harp/G5";
                break;
            case "skill6":
                return_soundfile = "http://gw2mb.com/sound/harp/A5";
                break;
            case "skill7":
                return_soundfile = "http://gw2mb.com/sound/harp/B5";
                break;
            case "skill8":
                return_soundfile = "http://gw2mb.com/sound/harp/C6";
                break;
        }
        /*} else if (location.pathname == "/lute.php") {
            switch (skill_id) {
                case "skill1":
                    return_soundfile = "http://gw2mb.com/sound/lute/C5";
                    break;
                case "skill2":
                    return_soundfile = "http://gw2mb.com/sound/lute/D5";
                    break;
                case "skill3":
                    return_soundfile = "http://gw2mb.com/sound/lute/E5";
                    break;
                case "skill4":
                    return_soundfile = "http://gw2mb.com/sound/lute/F5";
                    break;
                case "skill5":
                    return_soundfile = "http://gw2mb.com/sound/lute/G5";
                    break;
                case "skill6":
                    return_soundfile = "http://gw2mb.com/sound/lute/A5";
                    break;
                case "skill7":
                    return_soundfile = "http://gw2mb.com/sound/lute/B5";
                    break;
                case "skill8":
                    return_soundfile = "http://gw2mb.com/sound/lute/C6";
                    break;
            }
        } else if (location.pathname == "/bell2.php") {
            switch (skill_id) {
                case "skill1":
                    return_soundfile = "http://gw2mb.com/sound/bell2/C6";
                    break;
                case "skill2":
                    return_soundfile = "http://gw2mb.com/sound/bell2/D6";
                    break;
                case "skill3":
                    return_soundfile = "http://gw2mb.com/sound/bell2/E6";
                    break;
                case "skill4":
                    return_soundfile = "http://gw2mb.com/sound/bell2/F6";
                    break;
                case "skill5":
                    return_soundfile = "http://gw2mb.com/sound/bell2/G6";
                    break;
                case "skill6":
                    return_soundfile = "http://gw2mb.com/sound/bell2/A6";
                    break;
                case "skill7":
                    return_soundfile = "http://gw2mb.com/sound/bell2/B6";
                    break;
                case "skill8":
                    return_soundfile = "http://gw2mb.com/sound/bell2/C7";
                    break;
            }
        } else if (location.pathname == "/bass.php") {
            switch (skill_id) {
                case "skill1":
                    return_soundfile = "http://gw2mb.com/sound/bass/C2";
                    break;
                case "skill2":
                    return_soundfile = "http://gw2mb.com/sound/bass/D2";
                    break;
                case "skill3":
                    return_soundfile = "http://gw2mb.com/sound/bass/E2";
                    break;
                case "skill4":
                    return_soundfile = "http://gw2mb.com/sound/bass/F2";
                    break;
                case "skill5":
                    return_soundfile = "http://gw2mb.com/sound/bass/G2";
                    break;
                case "skill6":
                    return_soundfile = "http://gw2mb.com/sound/bass/A2";
                    break;
                case "skill7":
                    return_soundfile = "http://gw2mb.com/sound/bass/B2";
                    break;
                case "skill8":
                    return_soundfile = "http://gw2mb.com/sound/bass/C3";
                    break;
            }
        }*/
    }
    //tack on the proper file extension
    return_soundfile += audioSupport();

    return return_soundfile;
}

// get the sound file from the abc Pitch
function getSoundFileFromPitch(pitch, instrument) {
    var charArray = pitch.split('');
    var link_base = "http://gw2mb.com/sound/";
    var instrument_core = instrument.replace(".php", "").replace("/", "");
    var letter = charArray[0].toUpperCase();
    var octave;
    var file_extension;

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
    var num;
    var denom;

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

// get the abc notation note string based on the octave, instrument, and
// skill id
function getABCNote(skill_id) {
    var return_note;
    if (currentOctave == 0) {
        if (location.pathname == "/bell.php") {
            switch (skill_id) {
                case "skill1":
                    return_note = "D";
                    break;
                case "skill2":
                    return_note = "E";
                    break;
                case "skill3":
                    return_note = "F";
                    break;
                case "skill4":
                    return_note = "G";
                    break;
                case "skill5":
                    return_note = "A";
                    break;
                case "skill6":
                    return_note = "B";
                    break;
                case "skill7":
                    return_note = "c";
                    break;
                case "skill8":
                    return_note = "d";
                    break;
            }
        } else if (location.pathname == "/flute.php") {
            //there is no bottom octave for flute
        } else if (location.pathname == "/horn.php") {
            switch (skill_id) {
                case "skill1":
                    return_note = "E,";
                    break;
                case "skill2":
                    return_note = "F,";
                    break;
                case "skill3":
                    return_note = "G,";
                    break;
                case "skill4":
                    return_note = "A,";
                    break;
                case "skill5":
                    return_note = "B,";
                    break;
                case "skill6":
                    return_note = "C";
                    break;
                case "skill7":
                    return_note = "D";
                    break;
                case "skill8":
                    return_note = "E";
                    break;
            }
        } else if (location.pathname == "/harp.php") {
            switch (skill_id) {
                case "skill1":
                    return_note = "C,";
                    break;
                case "skill2":
                    return_note = "D,";
                    break;
                case "skill3":
                    return_note = "E,";
                    break;
                case "skill4":
                    return_note = "F,";
                    break;
                case "skill5":
                    return_note = "G,";
                    break;
                case "skill6":
                    return_note = "A,";
                    break;
                case "skill7":
                    return_note = "B,";
                    break;
                case "skill8":
                    return_note = "C";
                    break;
            }
        } else if (location.pathname == "/lute.php") {
            switch (skill_id) {
                case "skill1":
                    return_note = "C,";
                    break;
                case "skill2":
                    return_note = "D,";
                    break;
                case "skill3":
                    return_note = "E,";
                    break;
                case "skill4":
                    return_note = "F,";
                    break;
                case "skill5":
                    return_note = "G,";
                    break;
                case "skill6":
                    return_note = "A,";
                    break;
                case "skill7":
                    return_note = "B,";
                    break;
                case "skill8":
                    return_note = "C";
                    break;
            }
        } else if (location.pathname == "/bell2.php") {
            //there is no bottom octave for bell2
        } else if (location.pathname == "/bass.php") {
            //there is no bottom octave for bass
        }
    } else if (currentOctave == 1) {
        if (location.pathname == "/bell.php") {
            switch (skill_id) {
                case "skill1":
                    return_note = "d";
                    break;
                case "skill2":
                    return_note = "e";
                    break;
                case "skill3":
                    return_note = "f";
                    break;
                case "skill4":
                    return_note = "g";
                    break;
                case "skill5":
                    return_note = "a";
                    break;
                case "skill6":
                    return_note = "b";
                    break;
                case "skill7":
                    return_note = "c'";
                    break;
                case "skill8":
                    return_note = "d'";
                    break;
            }
        } else if (location.pathname == "/flute.php") {
            switch (skill_id) {
                case "skill1":
                    return_note = "E";
                    break;
                case "skill2":
                    return_note = "F";
                    break;
                case "skill3":
                    return_note = "G";
                    break;
                case "skill4":
                    return_note = "A";
                    break;
                case "skill5":
                    return_note = "B";
                    break;
                case "skill6":
                    return_note = "c";
                    break;
                case "skill7":
                    return_note = "d";
                    break;
                case "skill8":
                    return_note = "e";
                    break;
            }
        } else if (location.pathname == "/horn.php") {
            switch (skill_id) {
                case "skill1":
                    return_note = "E";
                    break;
                case "skill2":
                    return_note = "F";
                    break;
                case "skill3":
                    return_note = "G";
                    break;
                case "skill4":
                    return_note = "A";
                    break;
                case "skill5":
                    return_note = "B";
                    break;
                case "skill6":
                    return_note = "c";
                    break;
                case "skill7":
                    return_note = "d";
                    break;
                case "skill8":
                    return_note = "e";
                    break;
            }
        } else if (location.pathname == "/harp.php") {
            switch (skill_id) {
                case "skill1":
                    return_note = "C";
                    break;
                case "skill2":
                    return_note = "D";
                    break;
                case "skill3":
                    return_note = "E";
                    break;
                case "skill4":
                    return_note = "F";
                    break;
                case "skill5":
                    return_note = "G";
                    break;
                case "skill6":
                    return_note = "A";
                    break;
                case "skill7":
                    return_note = "B";
                    break;
                case "skill8":
                    return_note = "c";
                    break;
            }
        } else if (location.pathname == "/lute.php") {
            switch (skill_id) {
                case "skill1":
                    return_note = "C";
                    break;
                case "skill2":
                    return_note = "D";
                    break;
                case "skill3":
                    return_note = "E";
                    break;
                case "skill4":
                    return_note = "F";
                    break;
                case "skill5":
                    return_note = "G";
                    break;
                case "skill6":
                    return_note = "A";
                    break;
                case "skill7":
                    return_note = "B";
                    break;
                case "skill8":
                    return_note = "c";
                    break;
            }
        } else if (location.pathname == "/bell2.php") {
            switch (skill_id) {
                case "skill1":
                    return_note = "c";
                    break;
                case "skill2":
                    return_note = "d";
                    break;
                case "skill3":
                    return_note = "e";
                    break;
                case "skill4":
                    return_note = "f";
                    break;
                case "skill5":
                    return_note = "g";
                    break;
                case "skill6":
                    return_note = "a";
                    break;
                case "skill7":
                    return_note = "b";
                    break;
                case "skill8":
                    return_note = "c'";
                    break;
            }
        } else if (location.pathname == "/bass.php") {
            switch (skill_id) {
                case "skill1":
                    return_note = "C,,,";
                    break;
                case "skill2":
                    return_note = "D,,,";
                    break;
                case "skill3":
                    return_note = "E,,,";
                    break;
                case "skill4":
                    return_note = "F,,,";
                    break;
                case "skill5":
                    return_note = "G,,,";
                    break;
                case "skill6":
                    return_note = "A,,,";
                    break;
                case "skill7":
                    return_note = "B,,,";
                    break;
                case "skill8":
                    return_note = "C,,";
                    break;
            }
        }
    } else if (currentOctave == 2) {
        if (location.pathname == "/bell.php") {
            switch (skill_id) {
                case "skill1":
                    return_note = "d'";
                    break;
                case "skill2":
                    return_note = "e'";
                    break;
                case "skill3":
                    return_note = "f'";
                    break;
                case "skill4":
                    return_note = "g'";
                    break;
                case "skill5":
                    return_note = "a'";
                    break;
                case "skill6":
                    return_note = "b'";
                    break;
                case "skill7":
                    return_note = "c''";
                    break;
                case "skill8":
                    return_note = "d''";
                    break;
            }
        } else if (location.pathname == "/flute.php") {
            switch (skill_id) {
                case "skill1":
                    return_note = "e";
                    break;
                case "skill2":
                    return_note = "f";
                    break;
                case "skill3":
                    return_note = "g";
                    break;
                case "skill4":
                    return_note = "a";
                    break;
                case "skill5":
                    return_note = "b";
                    break;
                case "skill6":
                    return_note = "c'";
                    break;
                case "skill7":
                    return_note = "d'";
                    break;
                case "skill8":
                    return_note = "e'";
                    break;
            }
        } else if (location.pathname == "/horn.php") {
            switch (skill_id) {
                case "skill1":
                    return_note = "e";
                    break;
                case "skill2":
                    return_note = "f";
                    break;
                case "skill3":
                    return_note = "g";
                    break;
                case "skill4":
                    return_note = "a";
                    break;
                case "skill5":
                    return_note = "b";
                    break;
                case "skill6":
                    return_note = "c'";
                    break;
                case "skill7":
                    return_note = "d'";
                    break;
                case "skill8":
                    return_note = "e'";
                    break;
            }
        } else if (location.pathname == "/harp.php") {
            switch (skill_id) {
                case "skill1":
                    return_note = "c";
                    break;
                case "skill2":
                    return_note = "d";
                    break;
                case "skill3":
                    return_note = "e";
                    break;
                case "skill4":
                    return_note = "f";
                    break;
                case "skill5":
                    return_note = "g";
                    break;
                case "skill6":
                    return_note = "a";
                    break;
                case "skill7":
                    return_note = "b";
                    break;
                case "skill8":
                    return_note = "c'";
                    break;
            }
        } else if (location.pathname == "/lute.php") {
            switch (skill_id) {
                case "skill1":
                    return_note = "c";
                    break;
                case "skill2":
                    return_note = "d";
                    break;
                case "skill3":
                    return_note = "e";
                    break;
                case "skill4":
                    return_note = "f";
                    break;
                case "skill5":
                    return_note = "g";
                    break;
                case "skill6":
                    return_note = "a";
                    break;
                case "skill7":
                    return_note = "b";
                    break;
                case "skill8":
                    return_note = "c'";
                    break;
            }
        } else if (location.pathname == "/bell2.php") {
            switch (skill_id) {
                case "skill1":
                    return_note = "c'";
                    break;
                case "skill2":
                    return_note = "d'";
                    break;
                case "skill3":
                    return_note = "e'";
                    break;
                case "skill4":
                    return_note = "f'";
                    break;
                case "skill5":
                    return_note = "g'";
                    break;
                case "skill6":
                    return_note = "a'";
                    break;
                case "skill7":
                    return_note = "b'";
                    break;
                case "skill8":
                    return_note = "c''";
                    break;
            }
        } else if (location.pathname == "/bass.php") {
            switch (skill_id) {
                case "skill1":
                    return_note = "C,,";
                    break;
                case "skill2":
                    return_note = "D,,";
                    break;
                case "skill3":
                    return_note = "E,,";
                    break;
                case "skill4":
                    return_note = "F,,";
                    break;
                case "skill5":
                    return_note = "G,,";
                    break;
                case "skill6":
                    return_note = "A,,";
                    break;
                case "skill7":
                    return_note = "B,,";
                    break;
                case "skill8":
                    return_note = "C,";
                    break;
            }
        }
    }
    return return_note;
}

// verify that the pitch portion of the ABC note has valid syntax
function checkPitchSyntax(pitch) {

    var charArray = pitch.split('');

    // if the note is lower case make sure the rest of the string is single quotes
    if (/^[a-gz]$/.test(charArray[0])) {
        for (var i = 1; i < charArray.length; i++) {
            if (charArray[i] != "'") {
                return false;
            }
        }
    }
    // if the note is upper case make sure the rest of the string is commas
    else if (/^[A-GZ]$/.test(charArray[0])) {
        for (var i = 1; i < charArray.length; i++) {
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
    var return_array = new Array();

    // if there is no note return an error
    if (note == "")
        return "";

    var pitch = stripchars(note, "/1234567890");
    var noteLength = stripchars(note, "abcdefgzABCDEFGZ\\[\\],'");

    var charArray = pitch.split('');

    // if the pitch is a chord
    if (charArray[0] == '[') {
        // check to make sure the chord is ended properly
        if (charArray[charArray.length - 1] != ']') {
            return "";
        }

        var pitchArray = new Array();
        var pitchIndex = -1;
        //populate the pitch array
        for (var i = 1; i < charArray.length - 1; i++) {
            if (/^[a-gA-G]$/.test(charArray[i])) {
                pitchIndex++;
                pitchArray[pitchIndex] = charArray[i];
            } else {
                pitchArray[pitchIndex] = pitchArray[pitchIndex] + charArray[i];
            }
        }

        // remove duplicate values from array
        var uniquePitchArray = [];
        $.each(pitchArray, function(i, el) {
            if ($.inArray(el, uniquePitchArray) === -1)
                uniquePitchArray.push(el);
        });

        // assign the now unique array back to the original array
        pitchArray = uniquePitchArray.slice();

        return_array[0] = new Array();
        for (var i = 0; i < pitchArray.length; i++) {
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
    var notes = songtext.trim().split(/\s+/);

    // check each note for playback compatibility
    for (var i = 0; i < notes.length; i++) {
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
    var return_string;
    // reduce the numerator and denominator (ex. 6/4 => 3/2) and store the
    // result in num_den array
    var num_den = reduce(numerator, denominator);

    //stop audio if flute or horn before beginning a new note
    if (location.pathname == "/flute.php" || location.pathname == "/horn.php" || location.pathname == "/bass.php") {
        fadeoutAudio(currentAudio);
    }

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
        if (location.pathname == "/flute.php" || location.pathname == "/horn.php") {
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
            for (var i = 0; i < chordArray.length; i++) {
                return_string += "<span class=\"chordArrayMember\" onclick=\"removeChordArrayMember('" + addslashes(chordArray[i]) + "');\">" + chordArray[i] + "</span>";
            }
            $("#currentNotesInChord").html(return_string);
            // play the note
            if (location.pathname == "/flute.php" || location.pathname == "/horn.php") {
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
            for (var i = 0; i < chordArray.length; i++) {
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
    if (combatMode == 1 && chordMode == 0) {
        Idontknowwhyhavingthishereworksbutitjustdoes
    }
}

// add slashes when the str includes single quotes
function addslashes(str) {
    return (str).replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}

// remove the given note from the chord array and reprint the chord array
function removeChordArrayMember(note) {
    chordArray.removeValue(note);
    var return_string = "";
    for (var i = 0; i < chordArray.length; i++) {
        return_string += "<span class=\"chordArrayMember\" onclick=\"removeChordArrayMember('" + addslashes(chordArray[i]) + "');\">" + chordArray[i] + "</span>";
    }
    $("#currentNotesInChord").html(return_string);
}

// this function is invoked when the ocrave down button is pressed
function octave_down() {
    if (location.pathname == "/flute.php" || location.pathname == "/bell2.php" || location.pathname == "/bass.php") {
        if (currentOctave == 2) {
            currentOctave = 1;
            changecssproperty(document.getElementById("skill9_flute"), shadowprop, shadowvalue);
            var all = document.getElementsByClassName('skill');
            for (var i = 0; i < all.length; i++) {
                changecssproperty(all[i], transformprop, transformvalue1);
            }
            setTimeout(function() {
                document.getElementById("skill0").style.backgroundImage = "url('image/octave_up.png')";
                document.getElementById("skill0").style.cursor = "pointer";
                document.getElementById("skill9_flute").style.backgroundImage = "url('image/lock.png')";
                document.getElementById("skill9_flute").style.cursor = "default";
                for (var i = 0; i < all.length; i++) {
                    changecssproperty(all[i], transformprop, transformvalue2);
                }
            }, 250);
        }
    } else {
        if (currentOctave == 1) {
            currentOctave = 0;
            changecssproperty(document.getElementById("skill9"), shadowprop, shadowvalue);
            var all = document.getElementsByClassName('skill');
            for (var i = 0; i < all.length; i++) {
                changecssproperty(all[i], transformprop, transformvalue1);
            }
            setTimeout(function() {
                document.getElementById("skill9").style.backgroundImage = "url('image/lock.png')";
                document.getElementById("skill9").style.cursor = "default";
                for (var i = 0; i < all.length; i++) {
                    changecssproperty(all[i], transformprop, transformvalue2);
                }
            }, 250);
        } else if (currentOctave == 2) {
            currentOctave = 1;
            changecssproperty(document.getElementById("skill9"), shadowprop, shadowvalue);
            var all = document.getElementsByClassName('skill');
            for (var i = 0; i < all.length; i++) {
                changecssproperty(all[i], transformprop, transformvalue1);
            }
            setTimeout(function() {
                document.getElementById("skill0").style.backgroundImage = "url('image/octave_up.png')";
                document.getElementById("skill0").style.cursor = "pointer";
                for (var i = 0; i < all.length; i++) {
                    changecssproperty(all[i], transformprop, transformvalue2);
                }
            }, 250);
        }
    }
}

// this function is invoked when the ocrave up button is pressed
function octave_up() {
    if (location.pathname == "/flute.php" || location.pathname == "/bell2.php" || location.pathname == "/bass.php") {
        if (currentOctave == 1) {
            currentOctave = 2;
            changecssproperty(document.getElementById("skill0"), shadowprop, shadowvalue);
            var all = document.getElementsByClassName('skill');
            for (var i = 0; i < all.length; i++) {
                changecssproperty(all[i], transformprop, transformvalue1);
            }
            setTimeout(function() {
                document.getElementById("skill0").style.backgroundImage = "url('image/lock.png')";
                document.getElementById("skill0").style.cursor = "default";
                document.getElementById("skill9_flute").style.backgroundImage = "url('image/octave_down.png')";
                document.getElementById("skill9_flute").style.cursor = "pointer";
                for (var i = 0; i < all.length; i++) {
                    changecssproperty(all[i], transformprop, transformvalue2);
                }
            }, 250);
        }
    } else {
        if (currentOctave == 0) {
            currentOctave = 1;
            changecssproperty(document.getElementById("skill0"), shadowprop, shadowvalue);
            var all = document.getElementsByClassName('skill');
            for (var i = 0; i < all.length; i++) {
                changecssproperty(all[i], transformprop, transformvalue1);
            }
            setTimeout(function() {
                document.getElementById("skill9").style.backgroundImage = "url('image/octave_down.png')";
                document.getElementById("skill9").style.cursor = "pointer";
                for (var i = 0; i < all.length; i++) {
                    changecssproperty(all[i], transformprop, transformvalue2);
                }
            }, 250);
        } else if (currentOctave == 1) {
            currentOctave = 2;
            changecssproperty(document.getElementById("skill0"), shadowprop, shadowvalue);
            var all = document.getElementsByClassName('skill');
            for (var i = 0; i < all.length; i++) {
                changecssproperty(all[i], transformprop, transformvalue1);
            }
            setTimeout(function() {
                document.getElementById("skill0").style.backgroundImage = "url('image/lock.png')";
                document.getElementById("skill0").style.cursor = "default";
                for (var i = 0; i < all.length; i++) {
                    changecssproperty(all[i], transformprop, transformvalue2);
                }
            }, 250);
        }
    }
}

// this function plays the given notes. the index parameter is used for
// recursion. the initial function call should use zero for index
function playback(notes, index) {
    var audio;
    var notePair;

    // check to make sure the song is not empty, playback is not false, you have not receached the end of the song, and parseABCNote returned no errors
    if (notes != "" && stopPlayback == false && index < notes.length && (notePair = parseABCNote(notes[index], location.pathname, global_meter, global_tempo)) != "") {
        // if note is chord
        if (notePair[0] instanceof Array) {
            // play all notes in the chord
            for (var i = 0; i < notePair[0].length; i++) {
                audio = new Audio(notePair[0][i]);
                audio.volume = global_volume / 100;
                audio.play();
            }
        }
        // if note is individual
        else {
            var charArray = notes[index].split("");
            // if not a rest, play the not
            if (!(charArray[0] == "Z" || charArray[0] == "z")) {
                audio = new Audio(notePair[0]);
                audio.volume = global_volume / 100;
                if (location.pathname == "/flute.php" || location.pathname == "/horn.php") {
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
            if (location.pathname == "/flute.php" || location.pathname == "/horn.php" || location.pathname == "/bass.php") {
                fadeoutAudio(audio);
            }
            playback(notes, index + 1)
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

// modified playback function for use in the archive
function archive_playback(notes, index, instrument, meter, tempo) {
    var audio;
    var notePair;
    // check to make sure the song is not empty, playback is not false, you have not receached the end of the song, and parseABCNote returned no errors
    if (notes != "" && stopPlayback == false && index < notes.length && (notePair = parseABCNote(notes[index], instrument, meter, tempo)) != "") {
        // if note is chord
        if (notePair[0] instanceof Array) {
            for (var i = 0; i < notePair[0].length; i++) {
                audio = new Audio(notePair[0][i]);
                audio.volume = global_volume / 100;
                audio.play();
            }
        }
        // not chord
        else {
            var charArray = notes[index].split("");
            // if not a rest, play the note
            if (!(charArray[0] == "Z" || charArray[0] == "z")) {
                audio = new Audio(notePair[0]);
                audio.volume = global_volume / 100;
                if (instrument == "/flute.php" || instrument == "/horn.php") {
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
        // fade out note if flute or horn
        setTimeout(function() {
            if (instrument == "/flute.php" || instrument == "/horn.php" || instrument == "/bass.php") {
                fadeoutAudio(audio);
            }
            archive_playback(notes, index + 1, instrument, meter, tempo)
        }, notePair[1]);
    }
    // handle the song ending
    else {
        stopPlayback = false;
        nowPlaying = false;
        $("li#" + nowPlayingID + " .list_playback").val("Playback");
    }
}

// get the key to be pressed from the abc pitch
function getKeyFromPitch(pitch, octave, instrument) {
    if (instrument == "/bell.php") {
        switch (pitch) {
            case "D":
                return "{Numpad1 down}";
            case "d":
                if (octave == 0) {
                    return "{Numpad8 down}";
                } else {
                    return "{Numpad1 down}";
                }
            case "d'":
                if (octave == 1) {
                    return "{Numpad8 down}";
                } else {
                    return "{Numpad1 down}";
                }
            case "E":
            case "e":
            case "e'":
                return "{Numpad2 down}";
            case "F":
            case "f":
            case "f'":
                return "{Numpad3 down}";
            case "G":
            case "g":
            case "g'":
                return "{Numpad4 down}";
            case "A":
            case "a":
            case "a'":
                return "{Numpad5 down}";
            case "B":
            case "b":
            case "b'":
                return "{Numpad6 down}";
            case "c":
            case "c'":
            case "c''":
                return "{Numpad7 down}";
            case "d''":
                return "{Numpad8 down}";
            case "Z":
            case "z":
            case "z'":
                return "";
        }
    } else if (instrument == "/flute.php") {
        switch (pitch) {
            case "E":
                return "{Numpad1 down}";
            case "e":
                if (octave == 1) {
                    return "{Numpad8 down}";
                } else {
                    return "{Numpad1 down}";
                }
            case "F":
            case "f":
                return "{Numpad2 down}";
            case "G":
            case "g":
                return "{Numpad3 down}";
            case "A":
            case "a":
                return "{Numpad4 down}";
            case "B":
            case "b":
                return "{Numpad5 down}";
            case "c":
            case "c'":
                return "{Numpad6 down}";
            case "d":
            case "d'":
                return "{Numpad7 down}";
            case "e'":
                return "{Numpad8 down}";
            case "z":
            case "z'":
                return "";
        }
    } else if (instrument == "/horn.php") {
        switch (pitch) {
            case "E,":
                return "{Numpad1 down}";
            case "E":
                if (octave == 0) {
                    return "{Numpad8 down}";
                } else {
                    return "{Numpad1 down}";
                }
            case "e":
                if (octave == 1) {
                    return "{Numpad8 down}";
                } else {
                    return "{Numpad1 down}";
                }
            case "F,":
            case "F":
            case "f":
                return "{Numpad2 down}";
            case "G,":
            case "G":
            case "g":
                return "{Numpad3 down}";
            case "A,":
            case "A":
            case "a":
                return "{Numpad4 down}";
            case "B,":
            case "B":
            case "b":
                return "{Numpad5 down}";
            case "C":
            case "c":
            case "c'":
                return "{Numpad6 down}";
            case "D":
            case "d":
            case "d'":
                return "{Numpad7 down}";
            case "e'":
                return "{Numpad8 down}";
            case "Z":
            case "z":
            case "z'":
                return "";
        }
    } else if (instrument == "/harp.php") {
        switch (pitch) {
            case "C,":
                return "{Numpad1 down}";
            case "C":
                if (octave == 0) {
                    return "{Numpad8 down}";
                } else {
                    return "{Numpad1 down}";
                }
            case "c":
                if (octave == 1) {
                    return "{Numpad8 down}";
                } else {
                    return "{Numpad1 down}";
                }
            case "D,":
            case "D":
            case "d":
                return "{Numpad2 down}";
            case "E,":
            case "E":
            case "e":
                return "{Numpad3 down}";
            case "F,":
            case "F":
            case "f":
                return "{Numpad4 down}";
            case "G,":
            case "G":
            case "g":
                return "{Numpad5 down}";
            case "A,":
            case "A":
            case "a":
                return "{Numpad6 down}";
            case "B,":
            case "B":
            case "b":
                return "{Numpad7 down}";
            case "c'":
                return "{Numpad8 down}";
            case "Z":
            case "z":
            case "z'":
                return "";
        }
    } else if (instrument == "/lute.php") {
        switch (pitch) {
            case "C,":
                return "{Numpad1 down}";
            case "C":
                if (octave == 0) {
                    return "{Numpad8 down}";
                } else {
                    return "{Numpad1 down}";
                }
            case "c":
                if (octave == 1) {
                    return "{Numpad8 down}";
                } else {
                    return "{Numpad1 down}";
                }
            case "D,":
            case "D":
            case "d":
                return "{Numpad2 down}";
            case "E,":
            case "E":
            case "e":
                return "{Numpad3 down}";
            case "F,":
            case "F":
            case "f":
                return "{Numpad4 down}";
            case "G,":
            case "G":
            case "g":
                return "{Numpad5 down}";
            case "A,":
            case "A":
            case "a":
                return "{Numpad6 down}";
            case "B,":
            case "B":
            case "b":
                return "{Numpad7 down}";
            case "c'":
                return "{Numpad8 down}";
            case "Z":
            case "z":
            case "z'":
                return "";
        }
    } else if (instrument == "/bell2.php") {
        switch (pitch) {
            case "c":
                return "{Numpad1 down}";
            case "c'":
                if (octave == 1) {
                    return "{Numpad8 down}";
                } else {
                    return "{Numpad1 down}";
                }
            case "d":
            case "d'":
                return "{Numpad2 down}";
            case "e":
            case "e'":
                return "{Numpad3 down}";
            case "f":
            case "f'":
                return "{Numpad4 down}";
            case "g":
            case "g'":
                return "{Numpad5 down}";
            case "a":
            case "a'":
                return "{Numpad6 down}";
            case "b":
            case "b'":
                return "{Numpad7 down}";
            case "c''":
                return "{Numpad8 down}";
            case "z":
            case "z'":
                return "";
        }
    } else if (instrument == "/bass.php") {
        switch (pitch) {
            case "C,,,":
                return "{Numpad1 down}";
            case "C,,":
                if (octave == 1) {
                    return "{Numpad8 down}";
                } else {
                    return "{Numpad1 down}";
                }
            case "D,,,":
            case "D,,":
                return "{Numpad2 down}";
            case "E,,,":
            case "E,,":
                return "{Numpad3 down}";
            case "F,,,":
            case "F,,":
                return "{Numpad4 down}";
            case "G,,,":
            case "G,,":
                return "{Numpad5 down}";
            case "A,,,":
            case "A,,":
                return "{Numpad6 down}";
            case "B,,,":
            case "B,,":
                return "{Numpad7 down}";
            case "C,":
                return "{Numpad8 down}";
            case "z":
            case "z'":
                return "";
        }
    }
    return "false";
}

// return the guild wars 2 octave given the abc pitch
function getOctaveFromPitch(pitch, instrument) {
    if (instrument == "/bell.php") {
        switch (pitch) {
            case "D":
            case "E":
            case "F":
            case "G":
            case "A":
            case "B":
            case "c":
            case "Z":
                return 0;
            case "e":
            case "f":
            case "g":
            case "a":
            case "b":
            case "c'":
            case "z":
                return 1;
            case "e'":
            case "f'":
            case "g'":
            case "a'":
            case "b'":
            case "c''":
            case "d''":
            case "z'":
                return 2;
            case "d":
                return 0.5;
            case "d'":
                return 1.5;
        }
    } else if (instrument == "/flute.php") {
        switch (pitch) {
            case "E":
            case "F":
            case "G":
            case "A":
            case "B":
            case "c":
            case "d":
            case "z":
                return 1;
            case "f":
            case "g":
            case "a":
            case "b":
            case "c'":
            case "d'":
            case "e'":
            case "z'":
                return 2;
            case "e":
                return 1.5;
        }
    } else if (instrument == "/horn.php") {
        switch (pitch) {
            case "E,":
            case "F,":
            case "G,":
            case "A,":
            case "B,":
            case "C":
            case "D":
            case "Z":
                return 0;
            case "F":
            case "G":
            case "A":
            case "B":
            case "c":
            case "d":
            case "z":
                return 1;
            case "f":
            case "g":
            case "a":
            case "b":
            case "c'":
            case "d'":
            case "e'":
            case "z'":
                return 2;
            case "E":
                return 0.5;
            case "e":
                return 1.5;
        }
    } else if (instrument == "/harp.php") {
        switch (pitch) {
            case "C,":
            case "D,":
            case "E,":
            case "F,":
            case "G,":
            case "A,":
            case "B,":
            case "Z":
                return 0;
            case "D":
            case "E":
            case "F":
            case "G":
            case "A":
            case "B":
            case "z":
                return 1;
            case "d":
            case "e":
            case "f":
            case "g":
            case "a":
            case "b":
            case "c'":
            case "z'":
                return 2;
            case "C":
                return 0.5;
            case "c":
                return 1.5;
        }
    } else if (instrument == "/lute.php") {
        switch (pitch) {
            case "C,":
            case "D,":
            case "E,":
            case "F,":
            case "G,":
            case "A,":
            case "B,":
            case "Z":
                return 0;
            case "D":
            case "E":
            case "F":
            case "G":
            case "A":
            case "B":
            case "z":
                return 1;
            case "d":
            case "e":
            case "f":
            case "g":
            case "a":
            case "b":
            case "c'":
            case "z'":
                return 2;
            case "C":
                return 0.5;
            case "c":
                return 1.5;
        }
    } else if (instrument == "/bell2.php") {
        switch (pitch) {
            case "c":
            case "d":
            case "e":
            case "f":
            case "g":
            case "a":
            case "b":
            case "z":
                return 1;
            case "d'":
            case "e'":
            case "f'":
            case "g'":
            case "a'":
            case "b'":
            case "c''":
            case "z'":
                return 2;
            case "c'":
                return 1.5;
        }
    } else if (instrument == "/bass.php") {
        switch (pitch) {
            case "C,,,":
            case "D,,,":
            case "E,,,":
            case "F,,,":
            case "G,,,":
            case "A,,,":
            case "B,,,":
            case "z":
                return 1;
            case "D,,":
            case "E,,":
            case "F,,":
            case "G,,":
            case "A,,":
            case "B,,":
            case "C,":
            case "z'":
                return 2;
            case "C,,":
                return 1.5;
        }
    }
    return -1;
}

// this function finds the best direction to play a multi octave chord in order
// to reduce octave switches
function findDirection(octaveArray, startingOctave) {
    var one = true;
    var two = true;
    var zero = true;
    //check if the chord is only in one octave
    for (var i = 0; i < octaveArray.length; i++) {
        if (octaveArray[i] == 2 || octaveArray[i] == 0) {
            one = false;
        }
    }
    for (var i = 0; i < octaveArray.length; i++) {
        if (octaveArray[i] == 1 || octaveArray[i] == 0 || octaveArray[i] == 0.5) {
            two = false;
        }
    }
    for (var i = 0; i < octaveArray.length; i++) {
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
        var sum = octaveArray.reduce(function(a, b) {
            return a + b
        });
        var avg = sum / octaveArray.length;
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
    var return_array = new Array();
    var charArray = pitch.split('');
    var currentNoteOctave;

    // if there are multiple pitches create an array
    if (charArray[0] == "[") {
        var pitchArray = new Array();
        var pitchIndex = -1;
        //populate the pitch array
        for (var i = 1; i < charArray.length - 1; i++) {
            if (/^[a-gA-G]$/.test(charArray[i])) {
                pitchIndex++;
                pitchArray[pitchIndex] = charArray[i];
            } else {
                pitchArray[pitchIndex] = pitchArray[pitchIndex] + charArray[i];
            }
        }

        for (var i = 0; i < pitchArray.length; i++) {
            //check syntax and return error if bad syntax
            if (checkPitchSyntax(pitchArray[i]) == false) {
                return "";
            }
        }

        // sort the pitch array in case the user manually input his chord out
        // of order.
        pitchArray.sort(function(a, b) {
            var keyA = getKeyOctaveFromPitch(a, 0, instrument);
            var keyB = getKeyOctaveFromPitch(b, 0, instrument);
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
        var uniquePitchArray = [];
        $.each(pitchArray, function(i, el) {
            if ($.inArray(el, uniquePitchArray) === -1)
                uniquePitchArray.push(el);
        });

        // assign the now unique array back to the original array
        pitchArray = uniquePitchArray.slice();

        // find the guild wars 2 octave
        currentNoteOctave = new Array();
        for (var i = 0; i < pitchArray.length; i++) {
            currentNoteOctave[i] = getOctaveFromPitch(pitchArray[i], instrument);
            if (currentNoteOctave[i] == -1) {
                return ""
            }
        }

        // find the direction
        var direction = findDirection(currentNoteOctave, previousNoteOctave);

        return_array[0] = new Array();
        return_array[1] = new Array();
        // get the key to be pressed with the up direction
        if (direction == "up") {
            for (var i = 0; i < pitchArray.length; i++) {
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
            var j = 0;
            for (var i = pitchArray.length - 1; i >= 0; i--) {
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
            for (var i = 0; i < pitchArray.length; i++) {
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
    var outputString;
    var keyOctavePair;
    var abcPitch;
    var currentKeyValue;
    var previousNoteOctave = 1;
    var currentNoteOctave;
    var instrument_stripped = instrument.replace(".php", "").replace("/", "");
    var i;
    var j;

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

        // assign the variables from the keyoctavepair
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
                if (Math.abs(currentNoteOctave - previousNoteOctave) > 1 && (instrument == "/harp.php" || instrument == "/lute.php" || instrument == "/bell2.php")) {
                    outputString += "\u25BC ";
                }
            } else if (currentNoteOctave > previousNoteOctave) {
                outputString += "\u25B2 ";
                if (Math.abs(currentNoteOctave - previousNoteOctave) > 1 && (instrument == "/harp.php" || instrument == "/lute.php" || instrument == "/bell2.php")) {
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
    var startNotes = new Array();
    var endNotes = new Array();
    var keyValueArray = keyOctavePairArray[0];
    var noteOctaveArray = keyOctavePairArray[1];
    var found = false;

    if (currentNoteOctave == 2) {
        // create an array composed of all key presses in the previous octave
        for (var i = 0; i < noteOctaveArray.length; i++) {
            if (1 == noteOctaveArray[i] || 0 == noteOctaveArray[i]) {
                startNotes.push(keyValueArray[i]);
                found = true;
            }
        }
    } else if (currentNoteOctave == 0) {
        // create an array composed of all key presses in the previous octave
        for (var i = 0; i < noteOctaveArray.length; i++) {
            if (1 == noteOctaveArray[i] || 2 == noteOctaveArray[i]) {
                startNotes.push(keyValueArray[i]);
                found = true;
            }
        }
    } else {
        // create an array composed of all key presses in the previous octave
        for (var i = 0; i < noteOctaveArray.length; i++) {
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

    // reset the variable for the creation of the endNotes array
    found = false;

    // create an array composed of all key presses in the current octave
    for (var i = 0; i < noteOctaveArray.length; i++) {
        if (currentNoteOctave == noteOctaveArray[i]) {
            endNotes.push(keyValueArray[i]);
            found = true;
        }
    }

    // if there are no notes in the previousOctave then we do not need a delay
    if (found == false) {
        return 0;
    }

    for (var i = 0; i < startNotes.length; i++) {
        for (var j = 0; j < endNotes.length; j++) {
            if (startNotes[i] == endNotes[j]) {
                return 75;
            }
        }
    }

    return 0;
}

function constructAutoScript(notes, instrument, meter, tempo) {
    var outputString = "";
    var keyOctavePair;
    var abcPitch;
    var currentKeyValue;
    var previousKeyValue = "";
    var previousNoteOctave = 1;
    var currentNoteOctave;
    var finalNoteLength;
    var noteLength;
    var sleepDelay;
    var currentDelay;
    var i;
    var j;
    var k;

    //make sure the lute is in the center octave
    if (instrument == "/lute.php") {
        outputString = "SendInput {Numpad0}\nSleep, 250\nSendInput {Numpad0}\nSleep, 250\nSendInput {Numpad0}\nSleep, 250\nSendInput {Numpad9}\nSleep, 250\n";
    }

    for (i = 0; i < notes.length; i++) {
        //parse the note and initialize the variables
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
                for (var l = 0; l < previousKeyValue.length; l++) {
                    outputString += "SendInput " + previousKeyValue[l].replace("down", "up") + "\n";
                }
            } else if (previousKeyValue != "") {
                outputString += "SendInput " + previousKeyValue.replace("down", "up") + "\n";
            }

            // set k to zero
            k = 0;
            // set the previousKeyValue to an array
            previousKeyValue = new Array();

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
                    for (var l = 0; l < previousKeyValue.length; l++) {
                        outputString += "SendInput " + previousKeyValue[l].replace("down", "up") + "\n";
                    }

                    // reset the previousKeyValue
                    previousKeyValue = new Array();
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
                    for (var l = 0; l < previousKeyValue.length; l++) {
                        outputString += "SendInput " + previousKeyValue[l].replace("down", "up") + "\n";
                    }

                    // reset the previousKeyValue
                    previousKeyValue = new Array();
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
                if (previousKeyValue == currentKeyValue && instrument == "/horn.php") {
                    outputString += "SendInput {Esc}\n";
                }
                outputString += "SendInput " + previousKeyValue.replace("down", "up") + "\n";
            }

            //send input for any octave changes
            if (currentNoteOctave < previousNoteOctave) {
                outputString += "SendInput {Numpad0}\n";
                if (Math.abs(currentNoteOctave - previousNoteOctave) > 1 && (instrument == "/harp.php" || instrument == "/lute.php" || instrument == "/bell2.php")) {
                    outputString += "Sleep, 40\nSendInput {Numpad0}\n";
                    sleepDelay += 40;
                }
            } else if (currentNoteOctave > previousNoteOctave) {
                if (instrument == "/flute.php") {
                    outputString += "SendInput {Numpad0}\n";
                } else {
                    outputString += "SendInput {Numpad9}\n";
                    if (Math.abs(currentNoteOctave - previousNoteOctave) > 1 && (instrument == "/harp.php" || instrument == "/lute.php" || instrument == "/bell2.php")) {
                        outputString += "Sleep, 40\nSendInput {Numpad9}\n";
                        sleepDelay += 40;
                    }
                }
            }

            // send the key press for the next note
            if (currentKeyValue != "") {
                outputString += "SendInput " + currentKeyValue + "\n";
            } else if (instrument == "/flute.php") {
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
    if (instrument == "/flute.php") {
        outputString += "SendInput " + previousKeyValue.replace("down", "up") + "\n";
        outputString += "SendInput {Numpad9}\n";
    } else {
        if (previousKeyValue instanceof Array) {
            for (var l = 0; l < previousKeyValue.length; l++) {
                outputString += "SendInput " + previousKeyValue[l].replace("down", "up") + "\n";
            }
        } else if (previousKeyValue != "") {
            outputString += "SendInput " + previousKeyValue.replace("down", "up") + "\n";
        }
    }

    //return the finished autohotkey script
    return outputString.trim();
}

/******************************************************************************/
/* Functions Executed on Page Load                                            */
/******************************************************************************/

$(document).ready(function() {
    $("#songarea").focus();

    /* // The following are the click functions for the numerators and denominators
     $("#num_1").click(function() {
         var all = document.getElementsByClassName('num');
         for (var i = 0; i < all.length; i++) {
             all[i].style.border = "rgba(0, 0, 0, 0) solid 2px";
         }
         $("#num_1").css("border", "#1f0504 solid 2px");
         numerator = 1;
         // focus on the text area to make the cursor appear
         $("#songarea").focus();
     });

     $("#num_2").click(function() {
         var all = document.getElementsByClassName('num');
         for (var i = 0; i < all.length; i++) {
             all[i].style.border = "rgba(0, 0, 0, 0) solid 2px";
         }
         $("#num_2").css("border", "#000000 solid 2px");
         numerator = 2;
         // focus on the text area to make the cursor appear
         $("#songarea").focus();
     });

     $("#num_3").click(function() {
         var all = document.getElementsByClassName('num');
         for (var i = 0; i < all.length; i++) {
             all[i].style.border = "rgba(0, 0, 0, 0) solid 2px";
         }
         $("#num_3").css("border", "#1f0504 solid 2px");
         numerator = 3;
         // focus on the text area to make the cursor appear
         $("#songarea").focus();
     });

     $("#num_4").click(function() {
         var all = document.getElementsByClassName('num');
         for (var i = 0; i < all.length; i++) {
             all[i].style.border = "rgba(0, 0, 0, 0) solid 2px";
         }
         $("#num_4").css("border", "#1f0504 solid 2px");
         numerator = 4;
         // focus on the text area to make the cursor appear
         $("#songarea").focus();
     });

     $("#num_5").click(function() {
         var all = document.getElementsByClassName('num');
         for (var i = 0; i < all.length; i++) {
             all[i].style.border = "rgba(0, 0, 0, 0) solid 2px";
         }
         $("#num_5").css("border", "#1f0504 solid 2px");
         numerator = 5;
         // focus on the text area to make the cursor appear
         $("#songarea").focus();
     });

     $("#num_6").click(function() {
         var all = document.getElementsByClassName('num');
         for (var i = 0; i < all.length; i++) {
             all[i].style.border = "rgba(0, 0, 0, 0) solid 2px";
         }
         $("#num_6").css("border", "#1f0504 solid 2px");
         numerator = 6;
         // focus on the text area to make the cursor appear
         $("#songarea").focus();
     });

     $("#num_7").click(function() {
         var all = document.getElementsByClassName('num');
         for (var i = 0; i < all.length; i++) {
             all[i].style.border = "rgba(0, 0, 0, 0) solid 2px";
         }
         $("#num_7").css("border", "#1f0504 solid 2px");
         numerator = 7;
         // focus on the text area to make the cursor appear
         $("#songarea").focus();
     });

     $("#num_8").click(function() {
         var all = document.getElementsByClassName('num');
         for (var i = 0; i < all.length; i++) {
             all[i].style.border = "rgba(0, 0, 0, 0) solid 2px";
         }
         $("#num_8").css("border", "#1f0504 solid 2px");
         numerator = 8;
         // focus on the text area to make the cursor appear
         $("#songarea").focus();
     });

     $("#denom_1").click(function() {
         var all = document.getElementsByClassName('denom');
         for (var i = 0; i < all.length; i++) {
             all[i].style.border = "rgba(0, 0, 0, 0) solid 2px";
         }
         $("#denom_1").css("border", "#1f0504 solid 2px");
         denominator = 1;
         // focus on the text area to make the cursor appear
         $("#songarea").focus();
     });

     $("#denom_2").click(function() {
         var all = document.getElementsByClassName('denom');
         for (var i = 0; i < all.length; i++) {
             all[i].style.border = "rgba(0, 0, 0, 0) solid 2px";
         }
         $("#denom_2").css("border", "#1f0504 solid 2px");
         denominator = 2;
         // focus on the text area to make the cursor appear
         $("#songarea").focus();
     });

     $("#denom_3").click(function() {
         var all = document.getElementsByClassName('denom');
         for (var i = 0; i < all.length; i++) {
             all[i].style.border = "rgba(0, 0, 0, 0) solid 2px";
         }
         $("#denom_3").css("border", "#1f0504 solid 2px");
         denominator = 3;
         // focus on the text area to make the cursor appear
         $("#songarea").focus();
     });

     $("#denom_4").click(function() {
         var all = document.getElementsByClassName('denom');
         for (var i = 0; i < all.length; i++) {
             all[i].style.border = "rgba(0, 0, 0, 0) solid 2px";
         }
         $("#denom_4").css("border", "#1f0504 solid 2px");
         denominator = 4;
         // focus on the text area to make the cursor appear
         $("#songarea").focus();
     });

     $("#denom_8").click(function() {
         var all = document.getElementsByClassName('denom');
         for (var i = 0; i < all.length; i++) {
             all[i].style.border = "rgba(0, 0, 0, 0) solid 2px";
         }
         $("#denom_8").css("border", "#1f0504 solid 2px");
         denominator = 8;
         // focus on the text area to make the cursor appear
         $("#songarea").focus();
     });

     //variable to help control when the global mouse up event fires
     var down = false

     // this button changes function multiple times. it is used to handle,
     // playback, add rests, and add chords
     $("#health").mousedown(function() {
         changecssproperty(document.getElementById("health"), shadowprop, shadowvalue);
         // if combat mode is enabled
         if (combatMode == 1) {
             var note;

             // if chord mode is disabled
             if (chordMode == 0) {
                 if (currentOctave == 0) {
                     note = "Z";
                 } else if (currentOctave == 1) {
                     note = "z";
                 } else if (currentOctave == 2) {
                     note = "z'";
                 }
             }
             // if chord mode is enabled
             else {
                 note = "[";
                 for (var i = 0; i < chordArray.length; i++) {
                     note = note + chordArray[i];
                 }
                 note = note + "]";
             }

             var num_den = reduce(numerator, denominator);
             if (num_den[0] == num_den[1]) {
                 note = note + " ";
             } else if (num_den[1] == 1) {
                 note = note + num_den[0] + " ";
             } else if (num_den[0] == 1) {
                 note = note + "/" + num_den[1] + " ";
             } else {
                 note = note + num_den[0] + "/" + num_den[1] + " ";
             }

             if ((chordMode == 1 && chordArray.length > 1) || chordMode == 0) {
                 var sel = $("#songarea").getSelection();
                 if (sel.length == 0) {
                     if ($("#songarea").val().substring(sel.start, sel.end + 1) == " ") {
                         $("#songarea").setSelection(sel.end + 1, sel.end + 1);
                     }
                 }
                 $("#songarea").replaceSelectedText(note, "collapseToEnd");
                 $("#unsaved").html("Unsaved Changes");
                 chordArray = [];
                 $("#currentNotesInChord").html("");
             } else {
                 $("#add_err_song").show();
                 $("#add_err_song").html("You must select 2 or more notes");
                 $("#add_err_song").delay(2000).fadeOut("slow");
             }
         }
         // if combat mode is disabled
         else {
             if (nowPlaying == false) {
                 stopPlayback = false;
                 nowPlaying = true;
                 var sel = $("#songarea").getSelection();
                 if (sel.length == 0) {
                     playback($("#songarea").val().trim().split(/\s+/), 0);
                 } else {
                     playback(sel.text.trim().split(/\s+/), 0);
                 }
             } else {
                 stopPlayback = true;
             }
         }
         down = true;
     });*/

    // The following are the mousedown functions for the skill buttons
    /* $("#skill1").mousedown(function() {
         skill("skill1");
         down = true;
     });

     $("#skill2").mousedown(function() {
         skill("skill2");
         down = true;
     });

     $("#skill3").mousedown(function() {
         skill("skill3");
         down = true;
     });

     $("#skill4").mousedown(function() {
         skill("skill4");
         down = true;
     });

     $("#skill5").mousedown(function() {
         skill("skill5");
         down = true;
     });

     $("#skill6").mousedown(function() {
         skill("skill6");
         down = true;
     });

     $("#skill7").mousedown(function() {
         skill("skill7");
         down = true;
     });

     $("#skill8").mousedown(function() {
         skill("skill8");
         down = true;
     });
*/
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
            var skills = document.getElementsByClassName("skill");
            for (var i = 0; i < skills.length; i++) {
                // remove the shadow
                changecssproperty(skills[i], shadowprop, '', 'remove');
            }
            // remove the shadow
            changecssproperty(document.getElementById("health"), shadowprop, '', 'remove');
            // fadeout audio if flute or horn
            if (location.pathname == "/flute.php" || location.pathname == "/horn.php") {
                fadeoutAudio(currentAudio);
            }
            // focus on the text area to make the cursor appear
            $("#songarea").focus();
            // reset the down variable
            down = false;
        }
    });

    // these variables help control the hotkeys so holding down doesnt repeat
    // the key press
    var firedenter = false;
    var fireddelete = false;
    var firedswap = false;
    var fired1 = false;
    var fired2 = false;
    var fired3 = false;
    var fired4 = false;
    var fired5 = false;
    var fired6 = false;
    var fired7 = false;
    var fired8 = false;
    var fired9 = false;
    var fired0 = false;

    document.addEventListener('keydown', function(event) {
        if (hotkeys == true) {
            $("#songarea").focus();
            if (event.which == 49) {
                if (!fired1) {
                    fired1 = true;
                    note = 1;
                    skill("skill1");
                }
                event.preventDefault();
                event.stopPropagation();
                return false;
            } else if (event.which == 50) {
                if (!fired2) {
                    fired2 = true;
                    note = 2;
                    skill("skill2");
                }
                event.preventDefault();
                event.stopPropagation();
                return false;
            } else if (event.which == 51) {
                if (!fired3) {
                    fired3 = true;
                    note = 3;
                    skill("skill3");
                }
                event.preventDefault();
                event.stopPropagation();
                return false;
            } else if (event.which == 52) {
                if (!fired4) {
                    fired4 = true;
                    note = 4;
                    skill("skill4");
                }
                event.preventDefault();
                event.stopPropagation();
                return false;
            } else if (event.which == 53) {
                if (!fired5) {
                    fired5 = true;
                    note = 5;
                    skill("skill5");
                }
                event.preventDefault();
                event.stopPropagation();
                return false;
            } else if (event.which == 54) {
                if (!fired6) {
                    fired6 = true;
                    note = 6;
                    skill("skill6");
                }
                event.preventDefault();
                event.stopPropagation();
                return false;
            } else if (event.which == 55) {
                if (!fired7) {
                    fired7 = true;
                    note = 7;
                    skill("skill7");
                }
                event.preventDefault();
                event.stopPropagation();
                return false;
            } else if (event.which == 56) {
                if (!fired8) {
                    fired8 = true;
                    note = 8;
                    skill("skill8");
                }
                event.preventDefault();
                event.stopPropagation();
                return false;
            } else if (event.which == 57) {
                if (!fired9) {
                    fired9 = true;
                    octave_down();
                }
                event.preventDefault();
                event.stopPropagation();
                return false;
            } else if (event.which == 48) {
                if (!fired0) {
                    fired0 = true;
                    octave_up();
                }
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
        }
    });

    document.addEventListener('keyup', function(event) {
        if (hotkeys == true) {
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
            } else if (event.which == 49) {
                fired1 = false;
                changecssproperty(document.getElementById("skill1"), shadowprop, '', 'remove');
                if (location.pathname == "/flute.php" || location.pathname == "/horn.php") {
                    if (getSoundFileFromSkillId("skill1") == currentAudio.src) {
                        fadeoutAudio(currentAudio);
                    }
                }
                // focus on the text area to make the cursor appear
                $("#songarea").focus();
            } else if (event.which == 50) {
                fired2 = false;
                changecssproperty(document.getElementById("skill2"), shadowprop, '', 'remove');
                if (location.pathname == "/flute.php" || location.pathname == "/horn.php") {
                    if (getSoundFileFromSkillId("skill2") == currentAudio.src) {
                        fadeoutAudio(currentAudio);
                    }
                }
                // focus on the text area to make the cursor appear
                $("#songarea").focus();
            } else if (event.which == 51) {
                fired3 = false;
                changecssproperty(document.getElementById("skill3"), shadowprop, '', 'remove');
                if (location.pathname == "/flute.php" || location.pathname == "/horn.php") {
                    if (getSoundFileFromSkillId("skill3") == currentAudio.src) {
                        fadeoutAudio(currentAudio);
                    }
                }
                // focus on the text area to make the cursor appear
                $("#songarea").focus();
            } else if (event.which == 52) {
                fired4 = false;
                changecssproperty(document.getElementById("skill4"), shadowprop, '', 'remove');
                if (location.pathname == "/flute.php" || location.pathname == "/horn.php") {
                    if (getSoundFileFromSkillId("skill4") == currentAudio.src) {
                        fadeoutAudio(currentAudio);
                    }
                }
                // focus on the text area to make the cursor appear
                $("#songarea").focus();
            } else if (event.which == 53) {
                fired5 = false;
                changecssproperty(document.getElementById("skill5"), shadowprop, '', 'remove');
                if (location.pathname == "/flute.php" || location.pathname == "/horn.php") {
                    if (getSoundFileFromSkillId("skill5") == currentAudio.src) {
                        fadeoutAudio(currentAudio);
                    }
                }
                // focus on the text area to make the cursor appear
                $("#songarea").focus();
            } else if (event.which == 54) {
                fired6 = false;
                changecssproperty(document.getElementById("skill6"), shadowprop, '', 'remove');
                if (location.pathname == "/flute.php" || location.pathname == "/horn.php") {
                    if (getSoundFileFromSkillId("skill6") == currentAudio.src) {
                        fadeoutAudio(currentAudio);
                    }
                }
                // focus on the text area to make the cursor appear
                $("#songarea").focus();
            } else if (event.which == 55) {
                fired7 = false;
                changecssproperty(document.getElementById("skill7"), shadowprop, '', 'remove');
                if (location.pathname == "/flute.php" || location.pathname == "/horn.php") {
                    if (getSoundFileFromSkillId("skill7") == currentAudio.src) {
                        fadeoutAudio(currentAudio);
                    }
                }
                // focus on the text area to make the cursor appear
                $("#songarea").focus();
            } else if (event.which == 56) {
                fired8 = false;
                changecssproperty(document.getElementById("skill8"), shadowprop, '', 'remove');
                if (location.pathname == "/flute.php" || location.pathname == "/horn.php") {
                    if (getSoundFileFromSkillId("skill8") == currentAudio.src) {
                        fadeoutAudio(currentAudio);
                    }
                }
                // focus on the text area to make the cursor appear
                $("#songarea").focus();
            } else if (event.which == 57) {
                fired9 = false;
                changecssproperty(document.getElementById("skill9"), shadowprop, '', 'remove');
                // focus on the text area to make the cursor appear
                $("#songarea").focus();
            } else if (event.which == 48) {
                fired0 = false;
                changecssproperty(document.getElementById("skill0"), shadowprop, '', 'remove');
                // focus on the text area to make the cursor appear
                $("#songarea").focus();
            }
        }
    });
});