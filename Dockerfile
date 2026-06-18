FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Drop root privileges — the app only reads its own files and sends email.
USER node

EXPOSE 3000

CMD ["node", "server.js"]
