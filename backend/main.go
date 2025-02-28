package main

import (
	"github.com/gin-gonic/gin"
	"monopoly-game/api"
)

func main() {
	r := gin.Default()
	api.SetupRoutes(r)
	r.Run(":8080")
}
