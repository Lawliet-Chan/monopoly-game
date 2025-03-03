package game

import (
	"fmt" // 添加 fmt 用于调试
	"math/rand"
	"monopoly-game/model"
	"time"
)

var players = make(map[string]*model.Player)
var properties = initProperties()
var totalUSDT float64
var roundCount int

func initProperties() []model.Property {
	props := make([]model.Property, 61)
	for i := 0; i < 61; i++ {
		rand.Seed(time.Now().UnixNano())
		price := 5 + rand.Intn(16) // 5 到 20
		props[i] = model.Property{
			Index: i,
			Price: int64(price),
			Owner: "",
		}
	}
	return props
}

func AddPlayer(id string, usdt float64, coins int64, addr string) *model.Player {
	player := &model.Player{
		ID:         id,
		USDTLocked: usdt,
		GameCoins:  coins,
		WalletAddr: addr,
		Position:   0,
	}
	players[id] = player
	totalUSDT += usdt * 0.8
	return player
}

func MovePlayer(playerID string, dice int) int {
	player, exists := players[playerID]
	if !exists {
		return 0
	}
	player.Position = (player.Position + dice) % 61
	roundCount++
	if roundCount%5 == 0 {
		increasePropertyPrices()
	}
	return player.Position
}

func increasePropertyPrices() {
	for i := range properties {
		properties[i].Price = int64(float64(properties[i].Price) * 1.1)
	}
}

func BuyProperty(playerID string, propertyIdx int) (bool, int64, string) {
	player, exists := players[playerID]
	if !exists {
		return false, 0, "Player not found"
	}
	if propertyIdx < 0 || propertyIdx >= len(properties) {
		return false, 0, "Invalid property index"
	}
	prop := &properties[propertyIdx]
	fmt.Printf("BuyProperty: Player %s, Index %d, Current Owner: %s, Price: %d, Player Coins: %d\n", playerID, propertyIdx, prop.Owner, prop.Price, player.GameCoins) // 调试日志
	if prop.Owner != "" {
		return false, 0, "Property already owned"
	}
	if player.GameCoins < prop.Price {
		return false, 0, "Insufficient coins"
	}

	player.GameCoins -= prop.Price
	prop.Owner = playerID
	return true, prop.Price, ""
}

func SellProperty(playerID string, propertyIdx int) (bool, int64, string) {
	player, exists := players[playerID]
	if !exists {
		return false, 0, "Player not found"
	}
	if propertyIdx < 0 || propertyIdx >= len(properties) {
		return false, 0, "Invalid property index"
	}
	prop := &properties[propertyIdx]
	if prop.Owner != playerID {
		return false, 0, "You do not own this property"
	}

	player.GameCoins += prop.Price / 2
	prop.Owner = ""
	return true, prop.Price, ""
}

func GetPlayers() []*model.Player {
	var result []*model.Player
	for _, p := range players {
		result = append(result, p)
	}
	return result
}

func GetTotalCoins() int64 {
	var total int64
	for _, p := range players {
		total += p.GameCoins
	}
	return total
}

func GetTotalUSDT() float64 {
	return totalUSDT
}

func GetWinner() *model.Player {
	var winner *model.Player
	for _, p := range players {
		if winner == nil || p.GameCoins > winner.GameCoins {
			winner = p
		}
	}
	return winner
}

func GetProperties() []model.Property {
	return properties
}
