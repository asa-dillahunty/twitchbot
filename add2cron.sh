#!/bin/sh
cron_job="00 05 * * 1,3,5 ${PWD}/piscript.sh"
temp_file="mycron_tempfile_itShouldNotExist_please_laknferonavoajoeijhfa"

#copy cron tab over
crontab -l > $temp_file

# I have NO idea why, but it will not let me put "$cron_jobs" there
#   this works though, and if it's already running the script then what's it matter
count=$(grep -o "${PWD}/piscript.sh" "$temp_file" | wc -l)
# echo $count
if [ $count -ge 1 ];then
    echo "[FAILED] Cron job already exists"
else
    # add cron job to cron file
    echo "$cron_job" >> $temp_file
    crontab $temp_file
    echo "[SUCCESS] Cron job added"
fi
rm $temp_file
exit 0



