FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run data:verify && npm run build && mkdir -p data && chown -R node:node data
USER node
ENV HOST=0.0.0.0 PORT=3001
EXPOSE 3001
CMD ["npm","start"]
