FROM node:22-alpine AS build

WORKDIR /app

COPY apps/front/package-lock.json apps/front/package.json ./

RUN npm ci

COPY apps/front/ ./
RUN npm run build

FROM nginx:1.27.2-alpine-slim

COPY apps/front/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
