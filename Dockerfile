FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --prefer-offline
COPY . .
ENV CI=false
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV LYRA_AI_PROTOCOL=openai
ENV LYRA_AI_BASE_URL=https://api.openai.com/v1
ENV LYRA_AI_MODEL=gpt-4o-2024-11-20
ENV LYRA_AI_API_KEY=
ENV LYRA_AI_MAX_TOKENS=4096

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
