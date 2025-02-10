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

function showConfirmationDialog() {
	// HTMLを生成
	var html = HtmlService.createHtmlOutput(`
		<!DOCTYPE html>
		<html>
		<head>
			<script>
				function execute() {
					google.script.run.withSuccessHandler(closeDialog).executeRegister();
				}
				function closeDialog() {
					google.script.host.close();
				}
			</script>
		</head>
		<body>
			<p>登録を実行しますか？</p>
			<button onclick="execute()">OK</button>
			<button onclick="closeDialog()">キャンセル</button>
		</body>
		</html>
	`)
		.setWidth(300)
		.setHeight(150);

	// モーダルダイアログを表示
	SpreadsheetApp.getUi().showModalDialog(html, "確認");
}
