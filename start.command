#!/bin/bash
# 异见 VARIANT · 本地预览启动脚本
# 双击运行即可：自动启动本地服务器并打开浏览器
cd "$(dirname "$0")"
PORT=8080
URL="http://localhost:$PORT/index.html"
echo ""
echo "======================================"
echo "  异见 VARIANT · 本地预览"
echo "======================================"
echo ""
echo "  预览地址: $URL"
echo "  后台管理: http://localhost:$PORT/admin/ (需先完成部署配置)"
echo ""
echo "  按 Ctrl+C 停止服务并关闭窗口"
echo ""
sleep 1
open "$URL"
python3 -m http.server $PORT
