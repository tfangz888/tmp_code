#!/bin/bash

# 删除 QuestDB 表的旧分区
# 用法: ./drop_questdb_partitions.sh [table_name] [days_to_keep]

TABLE_NAME=${1:-"sensor_data"}
DAYS_TO_KEEP=${2:-10}
QUESTDB_HOST=${QUESTDB_HOST:-localhost}
QUESTDB_PORT=${QUESTDB_PORT:-9000}

echo "删除表 $TABLE_NAME 中 $DAYS_TO_KEEP 天前的分区..."

# 获取分区列表
get_partitions() {
    curl -s -G "http://$QUESTDB_HOST:$QUESTDB_PORT/exec" \
      --data-urlencode "query=SELECT * FROM table_partitions('$TABLE_NAME')" \
      | jq -r '.dataset[][]' 2>/dev/null
}

# 计算截止日期
CUTOFF_DATE=$(date -d "$DAYS_TO_KEEP days ago" '+%Y-%m-%d')
echo "截止日期: $CUTOFF_DATE"

# 获取要删除的分区列表
echo "获取分区信息..."
PARTITIONS=$(get_partitions)

if [ -z "$PARTITIONS" ]; then
    echo "无法获取分区信息或表不存在"
    exit 1
fi

echo "当前分区:"
echo "$PARTITIONS"

# 过滤出需要删除的分区（假设分区名格式为 YYYY-MM-DD）
PARTITIONS_TO_DELETE=""
while read -r partition; do
    if [[ "$partition" < "$CUTOFF_DATE" ]]; then
        if [ -z "$PARTITIONS_TO_DELETE" ]; then
            PARTITIONS_TO_DELETE="'$partition'"
        else
            PARTITIONS_TO_DELETE="$PARTITIONS_TO_DELETE, '$partition'"
        fi
    fi
done <<< "$PARTITIONS"

if [ -z "$PARTITIONS_TO_DELETE" ]; then
    echo "没有需要删除的分区"
    exit 0
fi

echo "准备删除分区: $PARTITIONS_TO_DELETE"

# 执行分区删除
DROP_QUERY="ALTER TABLE $TABLE_NAME DROP PARTITION LIST $PARTITIONS_TO_DELETE"

echo "执行删除命令: $DROP_QUERY"

RESPONSE=$(curl -s -G "http://$QUESTDB_HOST:$QUESTDB_PORT/exec" \
  --data-urlencode "query=$DROP_QUERY")

# 检查结果
if echo "$RESPONSE" | jq -e '.query' >/dev/null 2>&1; then
    echo "✅ 分区删除成功"
    echo "响应: $RESPONSE"
else
    echo "❌ 分区删除失败"
    echo "错误信息: $RESPONSE"
    exit 1
fi
