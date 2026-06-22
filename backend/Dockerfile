FROM node:20-alpine

WORKDIR /app

# Dependencias (capa cacheable)
COPY package*.json ./
RUN npm install --omit=dev

# Código fuente
COPY . .

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "src/server.js"]
