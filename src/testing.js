const readline = require('readline');
// const { getResponse, save } = require('./messageHandler');
const mHandler = require("./messageHandler");

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', function(line){
    // channel, tags, message, self
    var tags = {
        badges : {
            broadcaster : true
        },
        username: "tester"
    }
    var response = mHandler.getResponse("Samburnmonk",tags, line, false);
    if (!response || response.type == "none") return;
    if (response.type == "kill") {
        mHandler.save();
        console.log('Goodbye guys!');
        process.exit();
    }
    console.log(`${response.type}: ${response.message}`);
})