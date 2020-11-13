const _ = require("lodash");
const fs = require('fs');

module.exports = { getResponse, save };

var DATA_BASE = "data_base.json";
// uses custom data base
if (fs.existsSync("database.json")) DATA_BASE = "database.json";

db = JSON.parse(fs.readFileSync(DATA_BASE));
var memory = {};

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

function getResponse(channel, tags, message, self, auxMessage="") {
	
	// console.log(newDB);
	// var newDB = {
	// 	"hello" : {
	// 		type: "response",
	// 		responses: ["Hey!","Hello!","Ew"],
	// 		respond: function() {
	// 			console.log(this.responses[ Math.floor(Math.random() * this.responses.length) ]);
	// 		}
	// 	},
	// 	"hi":{
	// 		"type":"link",
	// 		"anchor": "hello",
	// 	}
	// };
	var response = {
		"type":"none",
		"message":""
	};

	var lMessage = message.toLowerCase()
		// .replace(/[^\w\s]|_/g, "") // this removes all non-alphanumeric characters
		.replace(/\s+/g, " ");

	if (!db[lMessage]) {
		// try find quotes

		sMessage = lMessage.split("\"");
		// console.log(sMessage);
		if (sMessage[0] == "" || sMessage[0] == " ") {
			// execute_command(cmd, message, sMessage, admin)
			// return newHandler(channel, tags, sMessage[0], self, lMessage.replace(`"${sMessage[1]}"`))
			return response;
		}

		// try split by spaces
		sMessage = lMessage.split(" ");
		if (db[sMessage[0]] && db[sMessage[0]].type == "command") {
			response = execute_command(sMessage[0],message,admin);
			return response;
		}

		
		
		
		return response;
	}

	if (self) return response;
	var admin = tags.badges.broadcaster;

	

	switch(db[lMessage].type) {
		case "response":
			response.type = "say";
			response.message = getRandom(db[lMessage].responses);
			return response;
		case "link":
			return newHandler(channel,tags,db[lMessage].anchor,self,auxMessage);
		case "command": // None of this currently does what it's supposed to. Don't run it
			response = execute_command(lMessage,message,admin);
			return response;
	}
}

function getRandom(array=[]) {
	return array[ Math.floor(Math.random() * array.length) ];
}  

function execute_command(cmd, message, admin) {
	var response = {
		type: "none",
		message: ""
	};

	if (db[cmd].protected == "true" && !admin) {
		response.type = "say";
		response.message = "Access Denied";
		return response;
	}

	switch(cmd) {
		case "echo":
			response.type = "say";
			response.message = message.substring(cmd.length+1);
			break;
		case "remember":
			// assume format is remember "trigger phrase" is "event phrase"
			// or are
			var lMessage = message.toLowerCase();
			var isIndex = lMessage.indexOf(" is ");
			var areIndex = lMessage.indexOf(" are ");
			
			if (isIndex + areIndex < 0) return response;
			else if (areIndex < 0) areIndex = isIndex+1;
			else isIndex = areIndex+1;

			message = message.replace(/\s+/g, " ");

			var triggerPhrase;
			var responsePhrase;
			if (isIndex < areIndex && isIndex != -1) {
				triggerPhrase = message.substring("remember ".length, isIndex);
				responsePhrase = message.substring(isIndex + " is ".length);
			}
			else if (areIndex != -1) {
				triggerPhrase = message.substring("remember ".length, areIndex);
				responsePhrase = message.substring(areIndex + " are ".length);
			}

			response.type = "say";
			response.message = "Got it!";
			if (memory[triggerPhrase]) {
				if (memory[triggerPhrase] == responsePhrase) response.message = "I already knew that one!";
				else response.message = `Okay! I'll overwrite "${memory[triggerPhrase]}" with "${responsePhrase}"`;
			}
			memory[triggerPhrase] = responsePhrase;
			break;
		case "what":
			// so we know cmd == what
			// now we find out if user says is or are, then remove that 
			var lMessage = message.toLowerCase().replace(/\s+/g, " ");

			response.type = "say";
			response.message = "Sorry, I don't know that :/";
			
			if (lMessage.startsWith("what is")) {
				var triggerPhrase = lMessage.substring("what is ".length);
				if (triggerPhrase.length > 0 && memory[triggerPhrase]) {
					response.message = `${triggerPhrase} is ${memory[triggerPhrase]}`;
				}
			}
			else if (lMessage.startsWith("what are")) {
				var triggerPhrase = lMessage.substring("what are ".length);
				if (triggerPhrase.length > 0 && memory[triggerPhrase]) {
					response.message = `${triggerPhrase} are ${memory[triggerPhrase]}`;
				}
			}
			else {
				response.message = "What are you trying to ask? Try formatting your question as \"What is [phrase]\"";
			}
			break;
		case "signoff":
			response.type = "kill";
			break;
		default:
			console.log("Command is not currently supported");
	}
	return response;
}

function oldExecute_command(cmd, message, sMessage, admin) {
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

		case "test":
			newHandler();
			return;

		default:
			console.log("Command is not currently supported");
			return "Command is not currently supported";
	}
}

function save() {
	// If I try to log off before the data is loaded, it won't overwrite
	// This cannot be asynchronous
	if (db) fs.writeFileSync(DATA_BASE, JSON.stringify(db, null, 2));
}