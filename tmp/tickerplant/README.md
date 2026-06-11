# tickerplant
tick.q 
tick/u.q 
tick/r.q 
https://github.com/KxSystems/kdb-tick 

# tickerplant路由器 tick.q
//////////////////////////// 
/ the tickerplant publishes all data immediately, and does not create a log file. 
/ 如果不设置定时器参数，会立即发布所有数据，并且不会记录LOG 
~/q/l32/q tick.q [schema] [destination directory] [-t N] -p 5010 
 
/ LOG记录进hdb目录. 一秒发布一次数据 
~/q/l32/q tick.q sym ./hdb -t 1000 -p 5010 


# Realtime 数据库 r.q
//////////////////////////////  
/ Realtime 数据库 r.q 
~/q/l32/q tick/r.q [tickerplant host:port] [hdb host:port] -p 5011  
~/q/l32/q tick/r.q :5010 :5012 -p 5011 

