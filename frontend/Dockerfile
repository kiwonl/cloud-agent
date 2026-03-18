# 1. Build Stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# 2. Runtime Stage
FROM nginx:alpine

# 기존 default.conf 삭제 (충돌 방지)
RUN rm /etc/nginx/conf.d/default.conf


# 복사할 경로 (Vite 기본 빌드 폴더는 dist)
COPY --from=build /app/dist /usr/share/nginx/html

# 런타임에 템플릿의 변수들을 치환해주는 설정용 템플릿
# default.template 에 넣어두면 런타임에 /etc/nginx/conf.d/default.conf 로 변환됩니다.
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

# 런타임에 $PORT 및 $AGENT_API_URL 변수를 주입하는 엔트리포인트 스크립트
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Cloud Run은 포트를 $PORT(8080 기본)로 주입하며 수신합니다.
EXPOSE 8080

CMD ["/entrypoint.sh"]
