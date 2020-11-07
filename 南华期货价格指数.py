# PM 普麦, 取数据出错,去掉
# 去掉中国金融期货交易所: IF , TF, T, "IC", "IH", 
# 去掉上海国际能源交易中心: "SC", "NR", 
syms = ["A", "AL", "CU", "RU", "M", "CF", "FU", "C", "SR", "Y", "TA", "ZN", "L", "P", "AU", "RB", "WR", "V", "PB", "J", "AG", "RO", "ER", "WS", "FG", "RS", "RM", "JM", "BU", "I", "JD", "JR", "BB", "FB", "PP", "HC", "LR", "SM", "SF", "CS", "SN", "NI", "ME", "TC", "CY", "CY", "AP", "SC", "SP", "EG", "CJ", "UR", "RR", "B", "SS", "EB", "SA"]

import akshare as ak
import pandas as pd

df = []
for sym in syms:
  print(sym)
  nh_df = ak.nh_price_index(code=sym) # 取数据
  nh_df.columns = [sym]
  df.append(nh_df)
  
df_all = pd.concat(df, axis=1)
df = df_all[df_all.index.day == 7] # 只取第每月7号的数据

