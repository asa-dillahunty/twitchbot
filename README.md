# Twitch Bot
This is a twitch bot I am making to moderate my twitch chat using [Node.js][nodejs] and [tmi.js][tmijs]

## Set Up
To run this node application you're gonna want to have Node.js installed as well as npm

I'm running this on a raspberry pi so I have a couple of scripts that can get your bot running and automatically fetching updates from your repository.
[add2cron.sh](add2cron.sh) will add [piScript.sh](piScript.sh) to your cron jobs so that every Monday Wednesday Friday the piScript will execute, killing the twitch bot and updating it. To do this the project has to be set up in such a way that running 
```bash
git pull
```
will pull from the repository. When it pulls from the repository **it will reset the default database.** This means anything "Learned" or "Unlearned" will be forgotten. For a database that will not be reset, create a `database.json` file. I recommend copying and renaming the `data_base.json` file.

To log in to Twitch, the bot needs a username and an oauth token. **Do not make these public by hardcoding them in.** To allow the app access to your username and oauth token, simply create a `.env` file of the format
```bash
USERNAME=your_bot_username
PASSWORD=oauth:your_oauth_token
```

You will also likely have to run
```bash
npm install --save
```
to make sure all necessary packages are installed before running the app.

## Running
To start the app run either
```bash
npm start
```
or
```bash
./piScript.sh
```
If you plan on running the cron job I recommend the latter.

### Talking to the bot
The bot currently knows 7 commands
* echo
    * the bot will echo what is was sent 
* remember
    * the bot will remember something while it is running. This is not saved so if the bot is reset it will forget.
    * to have the bot tell you what it remembers say "What is [The first word of what you wanted remembered]"
* forget
    * forget will erase something from temporary memory
    * to use it say "forget [The first word of what was remembered]"
* learn
    * learn will add things to the permanent database
    * "learn greeting howdy" will catalog howdy as a greeting
    * some lists require admin access to edit
* unlearn
    * unlearn will remove things from the permanent database
    * "unlearn greeting howdy" will remove howdy from the list of greetings
    * some lists require admin access to edit
* what
    * what is used to regurgitate information recorded using remember
    * for "remember record is 32 m/s" saying "what is record" will respond "record is 32 m/s"
* signoff
    * the bot will terminate
    * requires admin access

### Killing
To terminate the bot safely
* The broadcaster can say "signoff" in the chat
* Send the process a SIGTERM signal (this can be done using the top command)
* Press <kbd>ctrl</kbd>+<kbd>C</kbd> in the terminal where it is running


[nodejs]: https://nodejs.org/
[tmijs]: https://tmijs.com/