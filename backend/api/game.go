package api

import (
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
}

func joinGame(c *gin.Context) {
	var req struct {
		PlayerID   string  `json:"player_id"`
		USDTAmount float64 `json:"usdt_amount"`
		WalletAddr string  `json:"wallet_addr"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}
	if req.USDTAmount < 3.0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Minimum 3 USDT required"})
		return
	}

	operatorShare := req.USDTAmount * 0.2
	gameCoins := int64((req.USDTAmount - operatorShare) * 1000)
	player := game.AddPlayer(req.PlayerID, req.USDTAmount, gameCoins, req.WalletAddr)
	c.JSON(http.StatusOK, player)
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
	dice := rand.Intn(6) + 1 // 1-6
	newPosition := game.MovePlayer(req.PlayerID, dice)
	c.JSON(http.StatusOK, gin.H{
		"player_id": req.PlayerID,
		"dice":      dice,
		"position":  newPosition,
	})
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

	success, err := game.BuyProperty(req.PlayerID, req.PropertyIdx)
	if !success {
		c.JSON(http.StatusBadRequest, gin.H{"error": err})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Property bought"})
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

	success, err := game.SellProperty(req.PlayerID, req.PropertyIdx)
	if !success {
		c.JSON(http.StatusBadRequest, gin.H{"error": err})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Property sold"})
}

func endGame(c *gin.Context) {
	players := game.GetPlayers()
	totalCoins := game.GetTotalCoins()

	var payouts []struct {
		WalletAddr string  `json:"wallet_addr"`
		USDT       float64 `json:"usdt"`
	}
	for _, p := range players {
		usdtShare := (float64(p.GameCoins) / float64(totalCoins)) * game.GetTotalUSDT()
		payouts = append(payouts, struct {
			WalletAddr string  `json:"wallet_addr"`
			USDT       float64 `json:"usdt"`
		}{p.WalletAddr, usdtShare})
	}

	winner := game.GetWinner()
	c.JSON(http.StatusOK, gin.H{
		"payouts": payouts,
		"winner":  winner.ID,
	})
}
