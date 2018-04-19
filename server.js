const fs = require('fs');
const https = require('https');
const privateKey = fs.readFileSync('./privkey.pem', 'utf8');
const certificate = fs.readFileSync('./fullchain.pem', 'utf8');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const Datastore = require('nedb'),
    db = new Datastore({
        filename: './users',
        autoload: true
    }),
    tokens = new Datastore({
        filename: './tokens',
        autoload: true
    });

tokens.ensureIndex({
    fieldName: 'expirationDate',
    expireAfterSeconds: 604800
});

db.ensureIndex({
    fieldName: 'user',
    unique: true
});
db.ensureIndex({
    fieldName: 'userEmail',
    unique: true
});

const storePassword = userInfo => {
    return new Promise((resolve, reject) => {
        bcrypt.hash(userInfo.password, saltRounds, (err, hash) => {
            if (err) reject(err);
            else {
                if (userInfo.update) {
                    if (userInfo.user)
                        if (err) reject(err);
                        else {
                            bcrypt.hash(userInfo.newPassword, saltRounds, (err, hash) => {
                                if (err) reject(err);
                                else db.update({
                                    user: userInfo.user
                                }, {
                                    password: hash
                                }, (err, res) => {
                                    if (err) reject(err);
                                    else resolve(res);
                                });
                            });
                        }
                    else if (userInfo.email)
                        if (err) reject(err);
                        else {
                            bcrypt.hash(userInfo.newPassword, saltRounds, (err, hash) => {
                                if (err) reject(err);
                                else db.update({
                                    userEmail: userInfo.email
                                }, {
                                    password: hash
                                }, (err, res) => {
                                    if (err) reject(err);
                                    else resolve(res);
                                });
                            });
                        }
                } else {
                    console.log(userInfo, hash);
                    db.insert({
                        user: userInfo.userName,
                        userEmail: userInfo.email,
                        password: hash,
                        id: userInfo.id
                    }, (err, doc) => {
                        if (err) reject(err);
                        else resolve(doc);
                    });
                }
            }
        });
    });
};

const checkPassword = info => {
    return new Promise((resolve, reject) => {
        if (info.user) db.find({
            user: info.user
        }, function(err, docs) {
            if (err) reject(err);
            else if (docs.length == 0) reject("No Results");
            else {
                bcrypt.compare(info.password, docs[0].password, (err, res) => {
                    if (err) reject(err);
                    else if (res) resolve(res);
                    else reject(res);
                });
            }
        });
        else if (info.email) db.find({
            userEmail: info.email
        }, function(err, docs) {
            if (err) reject(err);
            else if (docs.length == 0) reject("No Results");
            else {
                bcrypt.compare(info.password, docs[0].password, (err, res) => {
                    if (err) reject(err);
                    else if (res) resolve(res);
                    else reject(res);
                });
            }
        });
        else reject();
    });
};

const changePassword = info => {
    return new Promise((resolve, reject) => {
        checkPassword(info).then(() => {
            info.update = true;
            storePassword(info).then(res => {
                resolve(res).catch(e => reject(e));
            }).catch(e => reject(e));
        }).catch(e => reject(e));
    });
};

/**
 * Imports the libary Node-RSA to use to further encrypt communications between client and server, also generates a new private key every time server is restarted
 */
const NodeRSA = require('node-rsa');
const key = new NodeRSA({
    b: 512
});

/*
 * Bundles the certificate and key for the first layer of communication encryption and then creates a HTTPS server to use as a bridge for secure communication
 */
const credentials = {
    key: privateKey,
    cert: certificate
};
const express = require('express');
let app = express();
let httpsServer = https.createServer(credentials, app);
httpsServer.listen(8484);

/*
 * Creates a websocket for clients to conenct to using the HTTPS secure server as a line of communication
 */
const WebSocketServer = require('ws').Server;
let wss = new WebSocketServer({
    server: httpsServer
});

function originIsAllowed(origin) {
    // put logic here to detect whether the specified origin is allowed.
    return true;
}

var connections = {};
var connectionIDCounter = 0;

wss.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
        // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }

    var connection = request.accept(null, request.origin);

    // Store a reference to the connection using an incrementing ID
    connection.id = connectionIDCounter++;
    connections[connection.id] = connection;

    // Now you can access the connection with connections[id] and find out
    // the id for a connection with connection.id

    console.log((new Date()) + ' Connection ID ' + connection.id + ' accepted.');
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected. ' +
            "Connection ID: " + connection.id);

        // Make sure to remove closed connections from the global pool
        delete connections[connection.id];
    });
});

// Broadcast to all open connections
function broadcast(data) {
    Object.keys(connections).forEach(function(key) {
        var connection = connections[key];
        if (connection.connected) {
            connection.send(data);
        }
    });
}

// Send a message to a connection by its connectionID
function sendToConnectionId(connectionID, data) {
    var connection = connections[connectionID];
    if (connection && connection.connected) {
        connection.send(data);
    }
}

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        console.log(message);
        message = key.decrypt(message);
        let messageJSON = JSON.parse(message);
        console.log('received: %s', message, messageJSON);
        if (messageJSON.login) checkPassword(messageJSON.info).then(() => {
            let loginToken = key.encrypt(messageJSON.info, 'base64');
            tokens.insert({
                user: messageJSON.info.user,
                token: loginToken
            });

            let returnMessage = {
                succeded: true,
                loginToken: loginToken
            };
            returnMessage = key.encrypt(JSON.stringify(returnMessage));

            ws.send(returnMessage);
        }).catch(ws.send(key.encrypt(JSON.stringify({
            succeded: false
        }))));

        if (messageJSON.newUser) {
            db.find({
                userEail: messageJSON.info.email
            }, (e, r) => {
                if (r.length == 0) storePassword(messageJSON.info).then(() => {
                    let loginToken = key.encrypt(messageJSON.info, 'base64');
                    tokens.insert({
                        user: messageJSON.info.user,
                        token: loginToken
                    });

                    let returnMessage = {
                        succeded: true,
                        loginToken: loginToken
                    };
                    returnMessage = key.encrypt(JSON.stringify(returnMessage));

                    ws.send(returnMessage);
                }).catch(e => console.log(e));
            });
        }
    });

    ws.send(key.exportKey('pkcs8-public-der'));
});