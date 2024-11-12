FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache build-base g++ cairo-dev pango-dev giflib-dev ttf-dejavu && \
    npm install
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache build-base g++ cairo-dev pango-dev giflib-dev ttf-dejavu && \
    npm install --omit-dev
COPY prisma ./prisma
RUN npx prisma generate
COPY --from=builder /app/build ./build
CMD ["node", "build/index.js"]
