#!/usr/bin/bash
source ~/env.sh
cd cd $TECH/PlatformArch/kdb/tickerplant/
# 启动 hdb
nohup $BASICDIR/kx/bin/q -p 5012 </dev/null >/dev/null 2>&1 &
# 启动 rdb, rdb要在tickerplant(5010) 和 hdb(5012) 启动后再启动，因为rdb要连接这两个服务. 不连接hdb则endofday时会可能崩.
nohup $BASICDIR/kx/bin/q $TECH/PlatformArch/kdb/tickerplant/tick/r.q :5010 :5012 -p 5011 </dev/null >/dev/null 2>&1 &
