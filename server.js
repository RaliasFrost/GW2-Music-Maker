const fs = require('fs');
const https = require('https');
const moment = require('moment');
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
		bcrypt.hash(userInfo.password, 10, (err, hash) => {
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
					db.insert({
						user: userInfo.user,
						userEmail: userInfo.email,
						admin: false,
						moderator: false,
						approved: false,
						password: hash
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
 * Imports the libary Node - RSA to use to further encrypt communications between client and server, also generates a new private key every time server is restarted
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
let connections = {};
let connectionID = 0;

const processMessages = (message, ws) => {
	if (connections[ws.id].key == undefined) {
		connections[ws.id].key = new NodeRSA(message, 'public');
		connections[ws.id].send(connections[ws.id].key.encrypt('{"KeyExchange": "Successful"}'));
	} else {
		message = key.decrypt(message);
		let messageJSON = JSON.parse(message);
		console.log(`${moment(Date.now()).format('MMMM Do YYYY, hh:mm:ss a')} New Message, Processing`)
		if (messageJSON.login) checkPassword(messageJSON.info).then(() => {
			console.log(`${moment(Date.now()).format('MMMM Do YYYY, hh:mm:ss a')} User Login!: ${messageJSON.info.user}`)
			let loginToken = connections[ws.id].key.encrypt(messageJSON.info, 'base64');
			tokens.find({
				user: messageJSON.info.user
			}, (e, r) => {
				if (r[0] != undefined) loginToken = r[0].loginToken;
				else tokens.insert({
					user: messageJSON.info.user,
					token: loginToken
				});
			});
			let returnMessage = {
				login: true,
				loginToken: loginToken,
				user: messageJSON.info.user
			};
			connections[ws.id].send(connections[ws.id].key.encrypt(JSON.stringify(returnMessage)));
		}).catch(ws.send(connections[ws.id].key.encrypt(JSON.stringify({
			login: false
		}))));
		if (messageJSON.newUser) {
			db.find({
				userEail: messageJSON.info.email
			}, (e, r) => {
				console.log(`${moment(Date.now()).format('MMMM Do YYYY, hh:mm:ss a')} New User Cration!: ${messageJSON.info.user}`)
				if (r.length == 0) storePassword(messageJSON.info).then(() => {
					let loginToken = connections[ws.id].key.encrypt(messageJSON.info, 'base64');
					tokens.insert({
						user: messageJSON.info.user,
						token: loginToken
					});
					let returnMessage = {
						login: true,
						loginToken: loginToken,
						user: messageJSON.info.user
					};
					connections[ws.id].send(connections[ws.id].key.encrypt(JSON.stringify(returnMessage)));
				}).catch(e => {
					let returnMessage = {
						accountCreation: true,
						successful: false
					};
					connections[ws.id].send(connections[ws.id].key.encrypt(JSON.stringify(returnMessage)));
				});
			});
		}
		if (messageJSON.logout) {
			tokens.remove({
				token: messageJSON.token
			});
		}
	}
};
wss.on('connection', (ws, req) => {
	console.log(`${moment(Date.now()).format('MMMM Do YYYY, hh:mm:ss a')} New Connection! IP: ${req.connection.remoteAddress}`);
	ws.id = connectionID++;
	ws.firstBuffer = 1;
	connections[ws.id] = ws;
	connections[ws.id].on('message', m => processMessages(m, connections[ws.id]));
	ws.send(key.exportKey('public'));
});