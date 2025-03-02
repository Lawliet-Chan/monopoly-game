# 使用 Node.js 20 作为基础镜像
FROM node:20

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制前端代码
COPY . .

# 构建 React 应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 运行应用
CMD ["npm", "start"]