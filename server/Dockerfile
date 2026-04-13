FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine

RUN apk add --no-cache curl fontconfig ttf-dejavu
ENV FONTCONFIG_PATH=/etc/fonts
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

RUN mkdir -p /app/uploads

EXPOSE 3000
CMD ["node", "dist/main.js"]
