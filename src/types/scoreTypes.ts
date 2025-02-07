// スコア計算用の型定義
export type PlayerPoint = {
	index: number;
	point: number;
};

export type FinalScore = {
	index: number;
	point: number;
};

// プレイヤー
export type Player = {
	id: number; // ID
	name: string; // 名前
	joinCount: number; // 参加数
	avgScore: number; // 平均スコア
	avgRank: number; // 平均順位
	totalIncome: number; // 総収支
};

// プレイヤー成績表
export type PlayerScore = {
	playerName: string; // プレイヤー名
	finalPoints: number; // 持ち点
	finalScore: number; // スコア
	income: number; // 収支
};

// 登録用
export type Register = {
	playerName: string; // プレイヤー名
	point: number; // 点数
	rank: number; // 順位
	skippedPlayer: boolean; // 飛ばした人
};

// 更新用
export type PlayerUpdateInfo = {
	name: string;
	participation: number;
	avgRank: number;
	avgScore: number;
	totalIncome: number;
};

// 結果のための型定義
export type EliminationBonusResult = number[];

// スコア計算関連の型定義
export type FinalScoreResult = {
	index: number;
	point: number;
};

export type NonTopScore = {
	index: number;
	point: number;
};

export type TopScore = {
	index: number;
	point: number;
};

export type PlayerPointWithIndex = {
	index: number;
	point: number;
};
