# LRIP frontend — build the static app and serve the production bundle.
# Build:  docker build -t lrip ./frontend
# Run:    docker run -p 5173:5173 lrip
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
EXPOSE 5173
CMD ["npx", "vite", "preview", "--host", "--port", "5173"]
