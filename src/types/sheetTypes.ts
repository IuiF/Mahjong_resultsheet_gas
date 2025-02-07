import { BonusByRankKey, MatchType, RatingKey } from "../types/configTypes";

// 成績表
export type ScoreTableBase = {
	matchDate: string; // 日付
	matchNumber: number; // 何半荘目
	matchType: MatchType; // 三麻/四麻
	rating: RatingKey; // レーティング
	bonusByRank: BonusByRankKey; // ウマ
};

// ヘッダー用型定義
export type SheetHeaders = {
	readonly SCORE_TABLE_BASE: readonly string[];
	readonly SCORE_TABLE_PLAYER: readonly string[];
	readonly PLAYER_LIST: readonly string[];
	readonly REGISTER: readonly string[];
};
