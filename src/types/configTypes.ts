import { RATINGS, BONUS_BY_RANK } from "../constants/gameConstants";

// 設定項目
export type Config = {
	matchType: MatchType; // 三麻/四麻
	rating: RatingKey; // レーティング
	bonusByRank: BonusByRankKey; // ウマ
};

// 登録用データ
export type RegisterData = {
	playerNames: string[];
	points: number[];
	ranks: number[];
	eliminator: boolean[];
	matchType: MatchType;
	rating: RatingKey;
	bonusByRank: BonusByRankKey;
};

// リテラル型の定義
export type MatchType = "三麻" | "四麻";
export type RatingKey = keyof typeof RATINGS;
export type BonusByRankKey =
	| keyof typeof BONUS_BY_RANK.YONMA
	| keyof typeof BONUS_BY_RANK.SANMA;

// ウマ計算用の型定義
export type BonusByRank = {
	readonly YONMA: {
		readonly [key: string]: readonly number[];
	};
	readonly SANMA: {
		readonly [key: string]: number[] | number;
	};
};

export type BonusArray = readonly number[];
