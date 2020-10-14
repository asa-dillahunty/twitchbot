const tmi = require("tmi.js");
const fs = require('fs');
const _ = require("lodash");
require('dotenv').config();

const DATA_BASE = "data_base.json";
var db = null;
var memory = {};

var default_channel = 'samburnmonk';

let spamDetection = {
	// uniqueChatActive: false,
	lastMessage: "",
	lastMessageSender: "",
	repeatedMessages: 0,
	tolorance: 3,
	timeActivated: 0,
	timeOutPeriod: 10000,
	timer: null,
	timeOutUser: function(channel,username) {
		client.timeout(channel,username,60,"Spam. If you don't believe your actions were representative of spam, feel free to email me at thatsucks@idfc.com")
		.then((data) => {}).catch((err) => {logErr(err);});
	},
	activateUniqueChat: function(channel) {
		client.say(channel,"/uniquechat");
		client.say(channel,`I have detected spam so I turned on unique chat for ${this.timeOutPeriod/1000} seconds`);

		this.timeActivated = Date.now();

		// if it's being buggy, and somehow you do this twice before it's cleared,
		//  the other one will never be cleared. SO ALWAYS CHECK
		if (this.timer) clearInterval(this.timer);
		this.timer = setInterval( (channel) => {
			if (this.timeActivated+this.timeOutPeriod < Date.now())
				this.deactivateUniqueChat(channel);
		}, this.timeOutPeriod+100)
	},
	deactivateUniqueChat: function(channel) {
		client.action(channel,"/uniquechatoff");
		clearInterval(this.timer);
	}
};
// fs.readFile(DATA_BASE, (err, data) => {
//     if (err) throw err;
//     db = JSON.parse(data);
//     console.log("Database loaded");
// });

db = JSON.parse(fs.readFileSync(DATA_BASE));
// console.log(db);
// return;

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

// while (db == null) {
//     console.log('yeah');
// }
// console.log(db);
// return;

const client = new tmi.client(options);

client.connect();

client.on('message', (channel, tags, message, self) => {
	if(self) return;

	var admin = false;
	if (tags.badges.broadcaster) admin = true;
	// console.log(tags);

	// spam detection
	if (message == spamDetection.lastMessage && tags.username == spamDetection.lastMessageSender) {
		spamDetection.repeatedMessages++;
		if (spamDetection.repeatedMessages > spamDetection.tolorance) {
			spamDetection.timeOutUser(channel, tags.username);
			return;
		}
	}
	else {
		spamDetection.lastMessage = message;
		spamDetection.lastMessageSender = tags.username;
		spamDetection.repeatedMessages = 0;
	}
	
	// This turns message lowercase, removes all non-alphanumeric characters, then removes repeated spaces
	lMessage = message.toLowerCase()
		.replace(/[^\w\s]|_/g, "")
		.replace(/\s+/g, " ");
		
	// console.log(lMessage);
	if (db.greeting.includes(lMessage)) {
		// if someone says hi, say hi back
		client.say(channel, `${db["my_greeting"][Math.floor(Math.random() * db["my_greeting"].length)]} @${tags.username}!`);
		return;
	}
	else if (db.farewell.includes(lMessage)) {
		// if someone says goodbye, say farewell
		client.say(channel, `${db["my_farewell"][Math.floor(Math.random() * db["my_farewell"].length)]} @${tags.username}!`);
		return;
	}
	sMessage = lMessage.split(" ");

	if (db.command.includes(sMessage[0])) {
		var response = execute_command(sMessage[0], lMessage, sMessage, admin);
		if (response)
			client.say(channel,response);
	}
});


/**
 * When connection is established, announce my presence
 */
client.on('connected', (address,port) => {
	client.say(default_channel, 'Hey chat! Sambotmonk is now connected');
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

	// If I try to log off before the data is loaded, it won't overwrite
	// This cannot be asynchronous
	if (db) fs.writeFileSync(DATA_BASE, JSON.stringify(db, null, 2));
	client.say(default_channel, 'Goodbye guys!');

	process.exit();
}

function execute_command(cmd, message, sMessage, admin) {
	switch(cmd) {
		case "echo":
			return message.replace(cmd+" ","");
		case "learn":
			// removes the command, its  
			phrase = message.replace(cmd+" ","").replace(sMessage[1]+" ","");
			// check if sensitive
			if (!admin && (sMessage[1] == "my_greeting" || 
					sMessage[1] == "my_farewell" || sMessage[1] == "command")) {
				return "Access denied";
			}
			// check if already known phrase
			if (db[sMessage[1]] && db[sMessage[1]].includes(phrase))
				return "I already know that one!";
			
			if (db[sMessage[1]]) db[sMessage[1]].push(phrase);
			else return `What's a ${sMessage[1]}?`;

			return `Learned ${phrase} is a ${sMessage[1]}`;

		case "unlearn":
			// removes the command, its  
			phrase = message.replace(cmd+" ","").replace(sMessage[1]+" ","");
			// check if sensitive
			if (!admin && (sMessage[1] == "my_greeting" || 
					sMessage[1] == "my_farewell" || sMessage[1] == "command")) {
				return "Access denied";
			}
			// check if already known phrase
			if (!db[sMessage[1]] || !db[sMessage[1]].includes(phrase))
				return "I can't unlearn what I don't know!";

			_.remove(db[sMessage[1]],function(n) { return n == phrase; });
			return `Unlearned ${phrase} as a ${sMessage[1]}`;

		case "remember":
			phrase = message.replace(cmd+" ","").replace(sMessage[1]+" ","");
			memory[sMessage[1]] = phrase;
			return "Sure thing!";

		case "forget":
			if (!memory[sMessage[1]]) {
				return 'Forget what?';
			}
			memory[sMessage[1]] = null;
			return `Forgot ${sMessage[1]}`;

		case "what":
			// assume recieve command in the form "what is"
			if (memory[sMessage[2]])
				return sMessage[2] +" "+ memory[sMessage[2]];
			return;
	
		case "signoff":
			if (admin) signoff();
			return;

		default:
			console.log("Command is not currently supported");
			return "Command is not currently supported";
	}
}

// delete messages


// uniquechat

// log errors
// this should potentially never run considering I will not be doing stress testing
function logErr(err) {
	fs.appendFile('botErrors.log',err,function(err) {
		if (err) console.log("Error recording error: ",err);
		else console.log("Error logged");
	});
}
