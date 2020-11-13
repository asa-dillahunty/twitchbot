# get the pid of the last time node was run
pid_file=".pid_log"
log_file="gitpull.log"
twitch_log="twitchChat.log"
last_pid=1
if test -f "$pid_file"; then
    last_pid=$(<"$pid_file")
fi
# echo "$last_pid"

if [ "$(ps -p $last_pid -o comm=)" = "node" ]; then
    # we can NEVER kill the root process
    if [ $last_pid -ne 1 ]; then
        kill -SIGTERM "$last_pid"
    fi
fi

echo "Starting pi script"

echo "---------------------------" >> $log_file

# I've had far too much trouble with such a simple date operator
date "+%Y-%m-%d %T" >> $log_file

echo "---------------------------" >> $log_file
git pull >> $log_file
echo "" >> $log_file

# maybe update files BEFORE starting lol
node . > $twitch_log &
last_pid=$!
echo "$last_pid" > "$pid_file"