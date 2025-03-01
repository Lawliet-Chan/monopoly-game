package main

import (
	"github.com/gin-gonic/gin"
	"monopoly-game/api"
)

func main() {
	r := gin.Default()

	// 添加 CORS 中间件
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*") // 允许所有来源（可限制为前端地址）
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// 处理 OPTIONS 请求
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204) // 返回 No Content
			return
		}
		c.Next()
	})

	// 设置 API 路由
	api.SetupRoutes(r)

	// 启动服务
	r.Run(":8080")
}
