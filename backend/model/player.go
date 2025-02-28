package model

type Player struct {
	ID         string  `json:"id"`
	USDTLocked float64 `json:"usdt_locked"`
	GameCoins  int64   `json:"game_coins"`
	WalletAddr string  `json:"wallet_addr"`
	Position   int     `json:"position"` // 新增玩家位置
}
