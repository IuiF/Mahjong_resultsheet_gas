import { BonusByRank } from "../types/configTypes";

// ウマ
export const BONUS_BY_RANK: BonusByRank = {
	YONMA: {
		"5 - 10": [10, 5, -5, -10],
		"10 - 20": [20, 10, -10, -20],
		"10 - 30": [30, 10, -10, -30],
		"20 - 30": [30, 20, -20, -30],
	},
	SANMA: {
		"順位5": [5, 0, -5],
		"順位10": [10, 0, -10],
		"順位20": [20, 0, -20],
		"沈み10": 10,
		"沈み20": 20,
	},
};

// レート(1000点あたり)
export const RATINGS: { readonly [key: string]: number } = {
	"テンイチ": 10,
	"テンニ": 20,
	"テンサン": 30,
	"テンゴ": 50,
	"テンピン": 100,
};

// 飛ばし賞の定数
export const ELIMINATION_BONUS = 10;
