import { MahjongScorerError } from "../types/errors";
import { SHEET_NAMES } from "../constants/sheetConstants";

// プレイヤー一覧の更新
export function updatePlayerList(
	playerNames: string[],
	points: number[],
	ranks: number[],
	incomes: number[],
): void {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const sheet = ss.getSheetByName(SHEET_NAMES.PLAYER_LIST);

	if (!sheet) {
		throw new MahjongScorerError("プレイヤー一覧シートが見つかりません");
	}

	// プレイヤー一覧の全データを取得
	const playerListData = sheet.getDataRange().getValues();
	const headerRow = playerListData[0];

	// 各列のインデックスを取得
	const columnIndices = {
		name: headerRow.indexOf("名前"),
		participation: headerRow.indexOf("参加数"),
		avgRank: headerRow.indexOf("平均順位"),
		avgScore: headerRow.indexOf("平均得点"),
		totalIncome: headerRow.indexOf("総合収支"),
	};

	// 列が見つからない場合のエラーチェック
	Object.entries(columnIndices).forEach(([key, index]) => {
		if (index === -1) {
			throw new MahjongScorerError(`列「${key}」が見つかりません`);
		}
	});

	// 3麻判定
	const isThreePlayerMahjong = playerNames.length === 3;

	// 各プレイヤーの情報を更新
	playerNames.forEach((playerName: string, index: number): void => {
		const playerRowIndex = playerListData.findIndex(
			(row) => row[columnIndices.name] === playerName,
		);

		if (playerRowIndex === -1) {
			throw new MahjongScorerError(
				`プレイヤー「${playerName}」が見つかりません`,
			);
		}

		const currentValues = {
			participation:
				playerListData[playerRowIndex][columnIndices.participation] || 0,
			avgRank: playerListData[playerRowIndex][columnIndices.avgRank] || 0,
			avgScore: playerListData[playerRowIndex][columnIndices.avgScore] || 0,
			totalIncome:
				playerListData[playerRowIndex][columnIndices.totalIncome] || 0,
		};

		// 3麻の場合は収支のみを更新
		if (isThreePlayerMahjong) {
			sheet
				.getRange(playerRowIndex + 1, columnIndices.totalIncome + 1)
				.setValue(currentValues.totalIncome + incomes[index]);
			return;
		}

		// 新しい値を計算
		const newParticipation = currentValues.participation + 1;
		const newValues = {
			participation: newParticipation,
			avgRank:
				(currentValues.participation * currentValues.avgRank + ranks[index]) /
				newParticipation,
			avgScore:
				(currentValues.participation * currentValues.avgScore + points[index]) /
				newParticipation,
			totalIncome: currentValues.totalIncome + incomes[index],
		};

		// 値を更新
		Object.entries(newValues).forEach(([key, value]) => {
			const columnIndex = columnIndices[key as keyof typeof columnIndices];
			if (columnIndex !== undefined) {
				sheet.getRange(playerRowIndex + 1, columnIndex + 1).setValue(value);
			}
		});
	});
}
