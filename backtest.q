/t为table
t:("ID**SFFFFFFFI*IFFFF**TIFIFIFIFIFIFIFIFIFIFIF"; enlist ",") 0: `:e:/data/shi/20200828.4.csv

t:select from t where sym in `AgTD`ag2012 /不能用within

differ2:{(or).(::;next)@\:@[differ x; 0;:;0b]}
select LastPrice from d2 where differ2 sym

myorders:([] ticknum:`int$(); direction:`symbol$(); price:`double$(); size:`long$(); ordertype:`symbol$(); other:`symbol$(); status:`symbol$()) / direction:`Buy,`Sell; ordertype:`Limit`Market; status:new, fill,partialfill
myorderevents: ([] ticknum:`int$(); direction:`symbol$(); price:`double$(); size:`long$(); ordertype:`symbol$(); other:`symbol$(); status:`symbol$())

/getPreTable:{[num]num#t} /已知行情
/getPostTable:{[num]num _ t} /未知行情

generatesignal:{[t] 0b} /有信号返回1b, 没信号返回0b
strategy:{[num]t1: num#t; ?[generatesignal t1; createorder[];0]}
createorder:{[ticknum; direction; price; size; ordertype; other] `myorders insert (ticknum; direction; price; size; ordertype; other; `New)}
executeorder:{[num]t1: last t} /模拟交易所成交order, 改变order状态



getPreTable each til count t

generatesignal:{[num] ?[;0b]}

strategy:{} /如果有信号，就buy或sell


