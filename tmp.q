sym1:`a
sym2:`b / 一定要大于sym1
anotherSym:{[sym] $[sym=sym1; sym2; sym1]}
anotherPrice:{[sym] $[sym=sym1; lastPriceOfSym2; lastPriceOfSym1]}

newDiffHelper:{[sym; price] $[sym=sym1; lastPriceOfSym2 - price; price - lastPriceOfSym1]}


high:56 /last 23 high
low:34 /last 23 low
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
onTick:{[NR; sym; price]
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
