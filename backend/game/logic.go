package game

import (
	"monopoly-game/model"
)

var players = make(map[string]*model.Player)
var properties = initProperties()
var totalUSDT float64

func initProperties() []model.Property {
	// 初始化 64 个地块
	props := make([]model.Property, 64)
	for i := 0; i < 64; i++ {
		props[i] = model.Property{
			Index: i,
			Price: 500,
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
		Position:   10, // 初始位置设为 10
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
	player.Position = (player.Position + dice) % 61 // 确保使用 61
	return player.Position
}

// 其他函数保持不变
func BuyProperty(playerID string, propertyIdx int) (bool, string) {
	player, exists := players[playerID]
	if !exists {
		return false, "Player not found"
	}
	if propertyIdx < 0 || propertyIdx >= len(properties) {
		return false, "Invalid property index"
	}
	prop := &properties[propertyIdx]
	if prop.Owner != "" {
		return false, "Property already owned"
	}
	if player.GameCoins < prop.Price {
		return false, "Insufficient coins"
	}

	player.GameCoins -= prop.Price
	prop.Owner = playerID
	return true, ""
}

func SellProperty(playerID string, propertyIdx int) (bool, string) {
	player, exists := players[playerID]
	if !exists {
		return false, "Player not found"
	}
	if propertyIdx < 0 || propertyIdx >= len(properties) {
		return false, "Invalid property index"
	}
	prop := &properties[propertyIdx]
	if prop.Owner != playerID {
		return false, "You do not own this property"
	}

	player.GameCoins += prop.Price / 2
	prop.Owner = ""
	return true, ""
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
