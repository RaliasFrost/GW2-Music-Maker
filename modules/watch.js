const WebSocket = require(`ws`),
    ws = new WebSocket(`ws://localhost:5672`);

var music = {
        playState: false,
        playingStateText: `Music paused`,
        shuffle: `NO_SHUFFLE`,
        repeat: `NO_REPEAT`,
        queue: [],
        volume: 100,
        lyrics: null,
        song: {
            title: null,
            artist: null,
            album: null,
            albumArt: null
        },
        time: {
            current: 0,
            total: 0
        }
    },
    playStateText = {
        true: `Music playing`,
        false: `Music paused`
    };

ws.on(`message`, function(message) {
    var payload = JSON.parse(message);
    var type = payload.channel,
        data = payload.payload;
    switch (type) {
        case `playState`:
            if (data) {
                music.playingStateText = playStateText[data];
            } else {
                music.playingStateText = playStateText[data];
            }
            music.playState = data;
            break;
        case `shuffle`:
            music.shuffle = data;
            break;
        case `repeat`:
            music.repeat = data;
            break;
        case `queue`:
            music.queue = data;
            break;
        case `volume`:
            music.volume = data;
            break;
        case `track`:
            music.song = data;
            break;
        case `lyrics`:
            music.lyrics = data;
            break;
        case `time`:
            music.time = data;
            break;
    }
    module.exports = music;
});