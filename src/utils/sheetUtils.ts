import { MahjongScorerError } from "../types/errors";
import { SHEET_NAMES, REGISTER_CELLS } from "../constants/sheetConstants";
import { SHEET_HEADERS } from "../constants/headers";

// 成績表シートのヘッダーからプレイヤー名を取得
export function getScoreTableHeaders(
	ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
): string[] {
	const sheet = ss.getSheetByName(SHEET_NAMES.SCORE_TABLE);
	if (!sheet) {
		throw new MahjongScorerError("成績表シートが見つかりません");
	}
	const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

	return headers
		.slice(SHEET_HEADERS.SCORE_TABLE_BASE.length)
		.filter((v: any): boolean => v !== "")
		.filter(
			(v: string, i: number, self: string[]): boolean => self.indexOf(v) === i,
		);
}

// リストで渡されたプレイヤーで不足分を成績表に追加
export function addPlayerColumnsToScoreTable(playerNames: string[]): void {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const sheet = ss.getSheetByName(SHEET_NAMES.SCORE_TABLE);
	if (!sheet) {
		throw new MahjongScorerError("成績表シートが見つかりません");
	}

	let currentColumn = sheet.getLastColumn();

	playerNames.forEach((name: string): void => {
		sheet.insertColumnsAfter(currentColumn, 3);
		const mergeRange = sheet.getRange(1, currentColumn + 1, 1, 3);
		mergeRange.merge();
		mergeRange.setValue(name);

		// readonly 配列を mutable な配列に変換
		const headerValues = [...SHEET_HEADERS.SCORE_TABLE_PLAYER];
		sheet.getRange(2, currentColumn + 1, 1, 3).setValues([headerValues]);

		currentColumn += 3;
	});
}

// 登録用シートのクリア
export function clearRegisterSheet() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const sheet = ss.getSheetByName(SHEET_NAMES.REGISTER);

	// 四麻の入力欄をクリア
	sheet.getRange(REGISTER_CELLS.YONMA).offset(1, 0, 4, 2).clearContent();
	// 三麻の入力欄をクリア
	sheet.getRange(REGISTER_CELLS.SANMA).offset(1, 0, 3, 2).clearContent();
	// 飛ばし有無のチェックボックスをクリア
	sheet.getRange(REGISTER_CELLS.YONMA).offset(1, 3, 4, 1).uncheck();
	sheet.getRange(REGISTER_CELLS.SANMA).offset(1, 3, 3, 1).uncheck();
}
