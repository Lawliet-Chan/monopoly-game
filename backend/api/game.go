package api

import (
	"fmt"
	"math/rand"
	"monopoly-game/game"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	r.POST("/join", joinGame)
	r.POST("/roll", rollDice)
	r.POST("/buy", buyProperty)
	r.POST("/sell", sellProperty)
	r.POST("/end", endGame)
	r.GET("/properties", getProperties) // 新增获取地块数据的 API
}

func joinGame(c *gin.Context) {
	var req struct {
		PlayerID   string  `json:"player_id"`
		Amount     float64 `json:"usdt_amount"`
		WalletAddr string  `json:"wallet_addr"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if req.Amount < 3.0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Minimum 3 USDT required"})
		return
	}

	operatorShare := req.Amount * 0.2
	gameCoins := int64((req.Amount - operatorShare) * 1000)
	player := game.AddPlayer(req.PlayerID, req.Amount, gameCoins, req.WalletAddr)
	c.JSON(http.StatusOK, player)
	fmt.Printf("Player %s joined at position %d\n", req.PlayerID, player.Position)
}

func rollDice(c *gin.Context) {
	var req struct {
		PlayerID string `json:"player_id"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	rand.Seed(time.Now().UnixNano())
	dice := rand.Intn(6) + 1
	newPosition := game.MovePlayer(req.PlayerID, dice)
	c.JSON(http.StatusOK, gin.H{
		"player_id": req.PlayerID,
		"dice":      dice,
		"position":  newPosition,
	})
	fmt.Printf("Player %s: Dice=%d, New Position=%d\n", req.PlayerID, dice, newPosition)
}

func buyProperty(c *gin.Context) {
	var req struct {
		PlayerID    string `json:"player_id"`
		PropertyIdx int    `json:"property_idx"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	success, price, err := game.BuyProperty(req.PlayerID, req.PropertyIdx)
	if !success {
		c.JSON(http.StatusBadRequest, gin.H{"error": err})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Property bought", "price": price})
}

func sellProperty(c *gin.Context) {
	var req struct {
		PlayerID    string `json:"player_id"`
		PropertyIdx int    `json:"property_idx"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	success, price, err := game.SellProperty(req.PlayerID, req.PropertyIdx)
	if !success {
		c.JSON(http.StatusBadRequest, gin.H{"error": err})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Property sold", "price": price})
}

func endGame(c *gin.Context) {
	players := game.GetPlayers()
	totalCoins := game.GetTotalCoins()

	var usdtPayouts []struct {
		WalletAddr string  `json:"wallet_addr"`
		USDT       float64 `json:"usdt"`
	}
	totalUsdt := game.GetTotalUSDT()

	for _, p := range players {
		usdtShare := (float64(p.GameCoins) / float64(totalCoins)) * totalUsdt
		usdtPayouts = append(usdtPayouts, struct {
			WalletAddr string  `json:"wallet_addr"`
			USDT       float64 `json:"usdt"`
		}{p.WalletAddr, usdtShare})
	}

	winner := game.GetWinner()
	c.JSON(http.StatusOK, gin.H{
		"usdt_payouts": usdtPayouts,
		"winner":       winner.ID,
	})
}

// 新增获取地块数据的 API
func getProperties(c *gin.Context) {
	properties := game.GetProperties()
	c.JSON(http.StatusOK, properties)
}
