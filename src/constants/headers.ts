import { SheetHeaders } from "../types/sheetTypes";

// ヘッダー
export const SHEET_HEADERS: SheetHeaders = {
	SCORE_TABLE_BASE: ["日付", "何半荘目", "三麻/四麻", "レート", "ウマ"],
	SCORE_TABLE_PLAYER: ["持ち点", "スコア", "収支"],
	PLAYER_LIST: ["ID", "名前", "参加数", "平均スコア", "平均順位", "総収支"],
	REGISTER: ["プレイヤー", "点数", "順位(自動入力)", "飛ばした人"],
};
