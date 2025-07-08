FROM node:22-alpine AS builder
ARG VITE_MODE
WORKDIR /app

# Use shell form to allow wildcard expansion
COPY package*.json ./

RUN npm ci
COPY . .
RUN npm run build -- --mode ${VITE_MODE}

FROM nginx:alpine AS final
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]
