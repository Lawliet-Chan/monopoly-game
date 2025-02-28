package model

type Property struct {
	Index int    `json:"index"`
	Price int64  `json:"price"`
	Owner string `json:"owner"`
}
