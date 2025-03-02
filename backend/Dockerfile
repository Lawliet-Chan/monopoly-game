# 使用 Go 1.23 作为基础镜像
FROM golang:1.23

# 设置工作目录
WORKDIR /app

# 复制 go.mod 和 go.sum
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制后端代码
COPY . .

# 编译 Go 应用
RUN go build -o monopoly-game

# 暴露端口
EXPOSE 8080

# 运行应用
CMD ["./monopoly-game"]