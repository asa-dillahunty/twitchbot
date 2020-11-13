const tmi = require("tmi.js");
const fs = require('fs');
const mHandler = require("./messageHandler");
// const { getResponse } = require("./messageHandler");
require('dotenv').config();


var default_channel = 'samburnmonk';

// fs.readFile(DATA_BASE, (err, data) => {
//     if (err) throw err;
//     db = JSON.parse(data);
//     console.log("Database loaded");
// });

const options = {
	options: {
		debug: true,
	},
	connection: {
		secure: true,
		reconnect: true,
	},
	identity: {
		username: process.env.USERNAME,
		password: process.env.PASSWORD
	},
	channels: [default_channel]
};

const client = new tmi.client(options);

client.connect();

client.on('message', (channel, tags, message, self) => {
	let response = mHandler.getResponse(channel,tags,message,self);

	switch (response.type) {
		case "none":
			break;
		case "say":
			client.say(channel, response.message);
			break;
		case "kill":
			signoff();
			break;
		default :
			console.log("Error: ", response)
	}
});


/**
 * When connection is established, announce my presence
 */
client.on('connected', (address,port) => {
	client.say(default_channel, `Hey chat! ${process.USERNAME} is now connected`);
});


/**
 * Catches ctrl + c
 * 
 * Allows the bot the chance to say goodbye
 */
process.on('SIGINT', signoff);

/**
 * Should catch a kill from top
 */
process.on('SIGTERM',signoff);

function signoff() {
	console.log("\nLogging off");

	mHandler.save();
	client.say(default_channel, 'Goodbye guys!');

	process.exit();
}

// log errors
// this should potentially never run considering I will not be doing stress testing
function logErr(err) {
	fs.appendFile('botErrors.log',err,function(err) {
		if (err) console.log("Error recording error: ",err);
		else console.log("Error logged");
	});
}
