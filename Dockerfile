FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps

FROM node:22-alpine AS shadcn
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json components.json tsconfig*.json vite.config.ts index.html ./
COPY src ./src
COPY public ./public

RUN npx shadcn@latest add --yes \
  button \
  badge \
  dialog \
  dropdown-menu \
  input \
  label \
  select \
  separator \
  tabs \
  tooltip \
  2>&1 && \
  find src/components/ui -name "*.tsx" -exec sed -i 's|from "src/lib/utils"|from "@/lib/utils"|g' {} +

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=shadcn /app ./
RUN npm run build

FROM nginx:alpine AS runner
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
COPY public/config.js /usr/share/nginx/html/config.js
COPY --from=builder /app/build /usr/share/nginx/html
ENTRYPOINT ["/entrypoint.sh"]
