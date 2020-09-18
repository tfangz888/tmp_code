/    \l e:\data\shi\backtest2.q
t:("ID**SFFFFFFFI*IFFFF**TIFIFIFIFIFIFIFIFIFIFIF"; enlist ",") 0: `:e:/data/shi/20200828.5.csv
t:select from t where sym in `AgTD`ag2012 /不能用within


num:count t

sym1:`AgTD
sym2:`ag2012
anotherSym:{[sym] $[sym=sym1; sym2; sym1]}
anotherPrice:{[sym] $[sym=sym1; lastPriceOfSym2; lastPriceOfSym1]}

newDiffHelper:{[sym; price] $[sym=sym1; lastPriceOfSym2 - price; price - lastPriceOfSym1]}


/ med each {1_x,y}\[6#0;til 100]
/ [3.43 3.45 3.43 3.48 3.52 3.50 3.39 3.48 3.41 3.38 3.49 3.45 3.51 3.50]


/ desc each flip (til 10; 10+til 10; 20+til 10)





a:select NR, LastPrice from t where sym=`ag2012
b:select NR, LastPrice:0N from t where sym=`AgTD
ag2012:`NR xasc a,b
ag2012:reverse 1_ fills reverse ag2012 /去掉最后一个, 并填充
a:select NR, LastPrice:0N from t where sym=`ag2012
b:select NR, LastPrice from t where sym=`AgTD
AgTD:`NR xasc a,b
AgTD:reverse 1_ fills reverse AgTD /去掉最后一个， 并填充
diff:(`NR xkey ag2012) - (`NR xkey AgTD)
diff:`NR`diff xcol diff /改key名字
num2: count diff

rangeHL:37 /参数
diffHighLow:select NR, high:rangeHL mmax diff, low:rangeHL mmin diff from diff
diffHighLow:select NR, high:rangeHL mmax diff, low:rangeHL mmin diff, HL:(rangeHL mmax diff)-(rangeHL mmin diff) from diff
highThreshold:prev exec high - (high - low)*0.1 from diffHighLow
lowThreshold:prev exec low + (high - low)*0.1 from diffHighLow

rangeMid:217 /参数
mmed: {[num;ys] med each {1_x,y}\[num#0;ys]}
diffMiddle: select NR, middle:mmed [rangeMid; diff] from diff
middle:prev exec middle from diffMiddle
middle: ?[(middle >= highThreshold) or (middle <= lowThreshold); (highThreshold + lowThreshold) % 2; middle] /调整middle以便在high, low范围内

x:exec diff from diff
/ 看下当前Price在过去的highlow range, middle range的哪个区间.  -2,-1,0,1,2
rangeState: ?[x > highThreshold; 2; ?[x < lowThreshold; -2; ?[(x <= highThreshold) and (x > (middle + 0.05*(highThreshold-lowThreshold))); 1; ?[(x >= lowThreshold) and (x < (middle - 0.05*(highThreshold-lowThreshold))); -1; 0]]] ]

/ a:([]NR: exec NR from t; rangeState:rangeState;sym:exec sym from t)
a:([]NR: -1 _ t `NR; sym:-1 _ t `sym; prevRangeState:prev rangeState; rangeState:rangeState)
/ b:select from a where differ rangeState

a1:update EnterBuyPosSym2:0, ExitBuyPosSym2:0, EnterSellPosSym2:0, ExitSellPosSym2:0 from a
a2:update EnterBuyPosSym2:1, ExitBuyPosSym2:0, EnterSellPosSym2:0, ExitSellPosSym2:0 from a1 where prevRangeState=2, rangeState=2 /开多， 另一个如何开空？
sumsEnterBuyPosSym2::sums a2 `EnterBuyPosSym2

exitList:a2 ExitBuyPosSym2
index: exec i from exitList where prevRangeState=-1
index:$[0 = first index;index;0,index]/以0开头
index:$[((count exitList)-1) = first reverse index;index;reverse ((count a2)-1), reverse index] /结尾索引保证正确
exitList [index]: sum each index _ a2 `EnterBuyPosSym2 /平仓赋值

a: 1 0 1 1 0 1 -1 0 1 1 0
sum each 0, index _ a


a: til 10
a[1 2 3] : 10 20 30
或 @[`a;1 2 3;:; 10 20 30]
