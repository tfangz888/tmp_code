
1. 
price / return → 用当前这个（线性插值）
/ q: 分位点 (0~1)，x: 数据
quantile:{[q;x]
  s:asc x;
  n:count s;
  if[n=0; :()];
  if[n=1; :first s];

  p:q*(n-1);
  i:floor p;
  j:ceiling p;

  if[i=j; :s i];

  s i + (p - i) * (s j - s i)
}

q)x:1 2 3 4 5 6 7 8

q)quantile[0.25;x]
2.75

q)quantile[0.5;x]
4.5

q)quantile[0.75;x]
6.25

2.
tick / order size → 用离散（no interpolation）
/ q ∈ [0,1], （推荐：lower)
quantile_discrete:{[q;x]
  s:asc x;
  n:count s;
  if[n=0; :()];
  i:floor q*(n-1);
  s i
}

quantile_higher:{[q;x]
  s:asc x;
  n:count s;
  i:ceiling q*(n-1);
  s i
}

quantile_nearest:{[q;x]
  s:asc x;
  n:count s;
  i:round q*(n-1);
  s i
}

q)x:1 2 3 4 5 6 7 8

q)quantile_discrete[0.25;x]

3. med
