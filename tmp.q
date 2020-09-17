sym1:`a
sym2:`b / 一定要大于sym1
anotherSym:{[sym] $[sym=sym1; sym2; sym1]}
anotherPrice:{[sym] $[sym=sym1; lastPriceOfSym2; lastPriceOfSym1]}

newDiffHelper:{[sym; price] $[sym=sym1; lastPriceOfSym2 - price; price - lastPriceOfSym1]}

a:217#reverse 1_delta diff1
b:217#reverse 1_delta diff2
diff:diff1, diff2

high:56 /last 23 high  mmax
low:34 /last 23 low    mmin
diffBig:: (high - low) * 0.8
middlePointHelper: {n:`int$0.1* count diff; avg n _ desc n _ asc diff}
middlePoint:middlePointHelper[]
middleHigh: middlePoint * 1.1
middleLow:  middlePoint * 0.9
middleRange: middleHigh - middleLow


postTick:{
  high:56; /last 23 high
  low:34; /last 23 low
  diffBig:: (high - low) * 0.8;
  middlePoint: {n:`int$0.1* count diff; avg n _ desc n _ asc diff};
  middleHigh: middlePoint * 1.1;
  middleLow:  middlePoint * 0.9;
  middleRange: middleHigh - middleLow
  }

/`OutOfBigDiff`WithinBigDiff`WithinMiddle
sglStat:`WithinMiddle
signal:`NoneSig /`Enter`Exit`NoneSig
generateSignal:{[sym; price]
  newDiff: newDiffHelper[sym; price];
  $[(sglState = `OutOfBigDiff) and (newDiff < diffBig); [sglStat:`WithinBigDiff;`Enter];
    (sglState = `WithinBigDiff) and (newDiff < middleRange); [sglStat:`WithinMiddle;`Exit];
    (sglState = `WithinMiddle) and (newDiff >= middleRange); [sglStat:`WithinBigDiff;`None];
    (sglState = `WithinBigDiff) and (newDiff >= diffBig); [sglStat:`OutOfBigDiff;`None];
    `None]
  }

postTick[]

onTick:{[tick] /[NR; sym; price]
  NR: tick `NR;
  sym: tick `sym;
  price: tick `NewPrice;
  generateSignal[]
  strategy[]
  postTick[]
  }

strategy:{
  createOrder
  }

excuteOrder:{
  fillOrder
  }



myorders:([] ticknum:`int$(); sym:`symbol$(); direction:`symbol$(); price:`double$(); size:`long$(); ordertype:`symbol$(); other:`symbol$(); status:`symbol$(); fillPrice:`double$()) / direction:`Buy,`Sell; ordertype:`Limit`Market; status:new, fill,partialfill
myorderevents: ([] ticknum:`int$(); direction:`symbol$(); price:`double$(); size:`long$(); ordertype:`symbol$(); other:`symbol$(); status:`symbol$())

main:{onTick each t}
main []

7 div 2 = 3

q)2 0N#til 10
0 1 2 3 4
5 6 7 8 9
q)0N 3#til 10
0 1 2
3 4 5
6 7 8
,9
