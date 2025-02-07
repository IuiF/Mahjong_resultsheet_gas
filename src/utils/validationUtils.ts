import { getScoreTableHeaders } from "../utils/sheetUtils";

// プレイヤーが未登録の場合そのプレイヤーを含むリストを返す
export function getUnregisteredPlayers(playerNameList: string[]): string[] {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const scoreTableHeaders = getScoreTableHeaders(ss);
	return playerNameList.filter(
		(name: string): boolean =>
			!scoreTableHeaders.some((header: string): boolean => header === name),
	);
}
