#!/bin/sh
# Cron wrapper for the Dwell price-snapshot job. nvm's node isn't on cron's PATH,
# so set it explicitly. Appends output to a log for debugging.
export PATH="/Users/bulbulahmed/.nvm/versions/node/v25.4.0/bin:$PATH"
cd /Users/bulbulahmed/start/Dwell/consumer-app || exit 1
npm run db:snapshot >> /tmp/dwell-snapshot.log 2>&1
