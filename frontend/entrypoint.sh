#!/bin/sh
# 환경 변수에 박힌 값을 런타임에 Nginx 설정 템플릿에 주입합니다.
envsubst '${PORT} ${AGENT_API_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# 실행을 Nginx 데몬에게 위임합니다.
exec nginx -g "daemon off;"
