# Development stage
FROM node:18-alpine AS development

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 8000

CMD ["npm", "run", "dev"]

# Production stage
FROM node:18-alpine AS production

WORKDIR /app
COPY package*.json ./
RUN npm install --only=production

COPY . .
EXPOSE 8000

USER node

CMD ["npm", "start"]