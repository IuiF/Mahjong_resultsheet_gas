// 登録用シートセル
export const REGISTER_CELLS: {
	readonly YONMA: string;
	readonly SANMA: string;
	readonly MATCH_TYPE: string;
	readonly RATING: string;
	readonly BONUS_BY_RANK_SANMA: string;
	readonly BONUS_BY_RANK_YONMA: string;
} = {
	YONMA: "A2:D6",
	SANMA: "A9:D12",
	MATCH_TYPE: "B16",
	RATING: "B17",
	BONUS_BY_RANK_YONMA: "B18",
	BONUS_BY_RANK_SANMA: "B19",
};

// シート名
export const SHEET_NAMES: {
	readonly REGISTER: string;
	readonly SCORE_TABLE: string;
	readonly PLAYER_LIST: string;
} = {
	REGISTER: "登録用",
	SCORE_TABLE: "成績表",
	PLAYER_LIST: "プレイヤー一覧",
};
