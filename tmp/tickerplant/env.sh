#!/usr/bin/bash
# source /q/env.sh 设置环境变量

# multiple versions of kdb+
# https://code.kx.com/q/kb/versions/
export QLIC=/home/toby/q
export QHOME=/home/toby/q/v4.0
export PATH=/q/l64:$PATH
export LD_LIBRARY_PATH=/q/l64:$LD_LIBRARY_PATH

# alias    q='export QHOME=/home/toby/q/v4.0; rlwrap -r $QHOME/l64/q'
# alias  q32='export QHOME=/home/toby/q/v3.6; rlwrap -r $QHOME/l32/q'
