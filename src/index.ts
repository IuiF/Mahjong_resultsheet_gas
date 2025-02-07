import { MahjongScorerError } from "./types/errors";
import { RegisterData } from "./types/configTypes";
import {
	registerScoreTable,
	getRegisterData,
} from "./services/registerService";
import { clearRegisterSheet } from "./utils/sheetUtils";

// 結果登録の実行関数
function executeRegister(): void {
	try {
		const data: RegisterData = getRegisterData();
		if (!data.playerNames || data.playerNames.length === 0) {
			throw new MahjongScorerError("プレイヤーが登録されていません");
		}

		registerScoreTable(
			data.playerNames,
			data.points,
			data.ranks,
			data.eliminator,
			data.matchType,
			data.rating,
			data.bonusByRank,
		);

		SpreadsheetApp.getActiveSpreadsheet().toast("登録が完了しました", "成功");

		clearRegisterSheet(); // 登録用シートのクリア
	} catch (error) {
		if (error instanceof Error) {
			SpreadsheetApp.getActiveSpreadsheet().toast(error.message, "エラー");
			console.error("エラーが発生しました:", error);
		}
	}
}
