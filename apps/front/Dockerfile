FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/back/package.json apps/back/package.json
COPY apps/extension/package.json apps/extension/package.json
COPY apps/front/package.json apps/front/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json

RUN npm ci --ignore-scripts

COPY apps/front/ apps/front/
RUN npm --workspace @trustlayer/front run build

FROM nginx:1.27.2-alpine-slim

COPY apps/front/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/front/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
