#!/usr/bin/bash
source ~/env.sh
cd $TECH/PlatformArch/kdb/tickerplant/
nohup $BASICDIR/kx/bin/q $TECH/PlatformArch/kdb/tickerplant/tick.q symA $MARKETDATA/kdb/tickerplant/A -t 100 -p 5010 </dev/null >/dev/null 2>&1 &
