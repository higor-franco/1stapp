# Stage 1: Build frontend
FROM node:24-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Build Go binary
FROM golang:1.25-alpine AS go-builder
WORKDIR /app
COPY backend/go.mod backend/go.sum ./backend/
RUN cd backend && go mod download
COPY backend/ ./backend/
RUN cd backend && CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server

# Stage 3: Runtime
FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata
ENV TZ=America/Sao_Paulo
WORKDIR /app
COPY --from=go-builder /app/backend/server .
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
EXPOSE 80
CMD ["./server"]
