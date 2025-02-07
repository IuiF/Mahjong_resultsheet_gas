// プレイヤー
type Player = {
	id: number; // ID
	name: string; // 名前
	joinCount: number; // 参加数
	avgScore: number; // 平均スコア
	avgRank: number; // 平均順位
	totalIncome: number; // 総収支
};

// 成績表
type ScoreTableBase = {
	matchDate: string; // 日付
	matchNumber: number; // 何半荘目
	matchType: string; // 三麻/四麻
	rating: string; // レーティング
	bonusByRank: number; // ウマ
};

// プレイヤー成績表
type PlayerScore = {
	playerName: string; // プレイヤー名
	finalPoints: number; // 持ち点
	finalScore: number; // スコア
	income: number; // 収支
};

// 登録用
type Register = {
	playerName: string; // プレイヤー名
	point: number; // 点数
	rank: number; // 順位
	skippedPlayer: boolean; // 飛ばした人
};

// 設定項目
type Config = {
	matchType: string; // 三麻/四麻
	rating: string; // レーティング
	bonusByRank: number; // ウマ
};

// 登録用シートセル
const REGISTER_CELLS = {
	YONMA: "A2:D6",
	SANMA: "A9:D12",
	MATCH_TYPE: "B16",
	RATING: "B17",
	BONUS_BY_RANK_SANMA: "B18",
	BONUS_BY_RANK_YONMA: "B19",
};

// シート名
const SHEET_NAMES = {
	REGISTER: "登録用",
	SCORE_TABLE: "成績表",
	PLAYER_LIST: "プレイヤー一覧",
};

// ヘッダー
const SHEET_HEADERS = {
	SCORE_TABLE_BASE: ["日付", "何半荘目", "三麻/四麻", "レート", "ウマ"],
	SCORE_TABLE_PLAYER: ["持ち点", "スコア", "収支"],
	PLAYER_LIST: ["ID", "名前", "参加数", "平均スコア", "平均順位", "総収支"],
	REGISTER: ["プレイヤー", "点数", "順位(自動入力)", "飛ばした人"],
};

// ウマ
const BONUS_BY_RANK = {
	YONMA: {
		"5 - 10": [10, 5, -5, -10],
		"10 - 20": [20, 10, -10, -20],
		"10 - 30": [30, 10, -10, -30],
		"20 - 30": [30, 20, -20, -30],
	},
	SANMA: {
		"順位5": [5, 0, -5],
		"順位10": [10, 0, -10],
		"順位20": [20, 0, -20],
		"沈み10": 10,
		"沈み20": 20,
	},
};

// レート(1000点あたり)
const RATINGS = {
	"テンイチ": 10,
	"テンニ": 20,
	"テンサン": 30,
	"テンゴ": 50,
	"テンピン": 100,
};

// プレイヤーが未登録の場合そのプレイヤーを含むリストを返す
function getUnregisteredPlayers(playerNameList) {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const scoreTableHeaders = getScoreTableHeaders(ss);
	return playerNameList.filter(function (name) {
		return !scoreTableHeaders.some(function (header) {
			return header === name;
		});
	});
}

// 成績表シートのヘッダーからプレイヤー名を取得
function getScoreTableHeaders(ss) {
	const sheet = ss.getSheetByName(SHEET_NAMES.SCORE_TABLE);
	const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

	return headers
		.slice(SHEET_HEADERS.SCORE_TABLE_BASE.length)
		.filter(function (v) {
			return v !== "";
		})
		.filter(function (v, i, self) {
			return self.indexOf(v) === i;
		});
}

// リストで渡されたプレイヤーで不足分を成績表に追加
function addPlayerColumnsToScoreTable(playerNames) {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const sheet = ss.getSheetByName(SHEET_NAMES.SCORE_TABLE);
	var currentColumn = sheet.getLastColumn();

	playerNames.forEach(function (name) {
		sheet.insertColumnsAfter(currentColumn, 3);
		sheet.getRange(1, currentColumn + 1, 1, 3).merge();
		sheet.getRange(1, currentColumn + 1).setValue(name);
		sheet
			.getRange(2, currentColumn + 1, 1, 3)
			.setValues([SHEET_HEADERS.SCORE_TABLE_PLAYER]);
		currentColumn += 3;
	});
}

// 実行した日時 YY-MM-DDを返す
function getToday() {
	const today = new Date();
	const year = today.getFullYear();
	const month = ("0" + (today.getMonth() + 1)).slice(-2);
	const date = ("0" + today.getDate()).slice(-2);
	const formattedDate = year + "-" + month + "-" + date;
	return formattedDate;
}

// スコア計算
function calculateScore(playerPoints, bonusByRank) {
	// スコアを降順でソートし、元のインデックスを保持
	const playerPointsMap = playerPoints
		.map((point, index) => ({ index, point }))
		.sort((a, b) => b.point - a.point);

	const finalScores = calculateFinalScores(playerPointsMap, bonusByRank);

	// 元のプレイヤー順に戻して点数のみ返す
	return finalScores
		.sort((a, b) => a.index - b.index)
		.map((score) => score.point);
}

// プレイヤー数に応じたスコア計算
function calculateFinalScores(playerPointsMap, bonusByRank) {
	const playerCount = playerPointsMap.length;

	if (playerCount === 4) {
		return calculateYonmaScores(playerPointsMap, bonusByRank);
	} else if (playerCount === 3) {
		return calculateSanmaScores(playerPointsMap, bonusByRank);
	}
	throw new Error("プレイヤー数が不正です");
}

// 四麻スコア計算（30000点返し）
function calculateYonmaScores(playerPointsMap, bonusByRank) {
	const bonus = BONUS_BY_RANK.YONMA[bonusByRank];
	const nonTopScores = calculateNonTopScores(
		playerPointsMap,
		30000,
		bonus,
		false,
	);
	return [calculateTopScore(playerPointsMap[0], nonTopScores), ...nonTopScores];
}

// 三麻スコア計算（40000点返し）
function calculateSanmaScores(playerPointsMap, bonusByRank) {
	const bonus = BONUS_BY_RANK.SANMA[bonusByRank];
	const isSinking = bonusByRank.startsWith("沈み");
	const nonTopScores = calculateNonTopScores(
		playerPointsMap,
		40000,
		bonus,
		isSinking,
	);
	return [calculateTopScore(playerPointsMap[0], nonTopScores), ...nonTopScores];
}

// 2位以下のスコア計算
function calculateNonTopScores(playerPointsMap, basePoints, bonus, isSinking) {
	return playerPointsMap.slice(1).map((player, index) => ({
		index: player.index,
		point:
			(player.point - basePoints) / 1000 +
			(isSinking ? (player.point < basePoints ? -bonus : 0) : bonus[index + 1]),
	}));
}

// トップのスコアを他プレイヤーの合計の負値として計算
function calculateTopScore(topPlayer, nonTopScores) {
	return {
		index: topPlayer.index,
		point: -nonTopScores.reduce((sum, p) => sum + p.point, 0),
	};
}

// スコアから収支を計算
function calculateIncome(finalScores, rating) {
	const ratingValue = RATINGS[rating];
	if (ratingValue === undefined) {
		console.error("Invalid rating:", rating);
		return finalScores.map(() => 0);
	}

	const result = finalScores.map((score) => score * ratingValue);
	return result;
}

// 登録用シートから結果と設定を取得
function getRegisterData() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const sheet = ss.getSheetByName(SHEET_NAMES.REGISTER);

	// 設定項目の取得
	const matchType = sheet.getRange(REGISTER_CELLS.MATCH_TYPE).getValue();
	const rating = sheet.getRange(REGISTER_CELLS.RATING).getValue();
	const bonusByRankYonma = sheet
		.getRange(REGISTER_CELLS.BONUS_BY_RANK_YONMA)
		.getValue();
	const bonusByRankSanma = sheet
		.getRange(REGISTER_CELLS.BONUS_BY_RANK_SANMA)
		.getValue();
	const bonusByRank =
		matchType === "三麻" ? bonusByRankSanma : bonusByRankYonma;

	let playerNames = [];
	let points = [];
	let ranks = [];
	let eliminator = [];

	// 登録情報の取得(四麻)
	if (matchType === "四麻") {
		const data = sheet.getRange(REGISTER_CELLS.YONMA).getValues();
		// プレイヤー名が入力されている行のみを抽出
		const validRows = data.slice(1).filter((row) => row[0] !== "");

		playerNames = validRows.map((row) => row[0]);
		points = validRows.map((row) => row[1]);
		ranks = validRows.map((row) => row[2]);
		eliminator = validRows.map((row) => row[3]);

		// 点数合計のチェック
		if (points.length > 0 && points.reduce((a, b) => a + b, 0) !== 100000) {
			throw new Error("点数合計が100000ではありません");
		}
	} else {
		// 登録情報の取得(三麻)
		const data = sheet.getRange(REGISTER_CELLS.SANMA).getValues();
		// プレイヤー名が入力されている行のみを抽出
		const validRows = data.slice(1).filter((row) => row[0] !== "");

		playerNames = validRows.map((row) => row[0]);
		points = validRows.map((row) => row[1]);
		ranks = validRows.map((row) => row[2]);
		eliminator = validRows.map((row) => row[3]);

		// 点数合計のチェック
		if (points.length > 0 && points.reduce((a, b) => a + b, 0) !== 105000) {
			throw new Error("点数合計が105000ではありません");
		}
	}

	console.log("取得したデータ:", {
		playerNames,
		points,
		ranks,
		eliminator,
		matchType,
		rating,
		bonusByRank,
	});

	return {
		playerNames,
		points,
		ranks,
		eliminator,
		matchType,
		rating,
		bonusByRank,
	};
}

// プレイヤー一覧の更新
function updatePlayerList(playerNames, points, ranks, incomes) {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const sheet = ss.getSheetByName(SHEET_NAMES.PLAYER_LIST);

	// プレイヤー一覧の全データを取得
	const playerListData = sheet.getDataRange().getValues();
	const headerRow = playerListData[0];

	// 各列のインデックスを取得
	const nameColIndex = headerRow.indexOf("名前");
	const participationColIndex = headerRow.indexOf("参加数");
	const avgRankColIndex = headerRow.indexOf("平均順位");
	const avgScoreColIndex = headerRow.indexOf("平均得点");
	const totalIncomeColIndex = headerRow.indexOf("総合収支");

	// 各プレイヤーの情報を更新
	playerNames.forEach((playerName, index) => {
		// プレイヤーの行を検索
		const playerRowIndex = playerListData.findIndex(
			(row) => row[nameColIndex] === playerName,
		);
		if (playerRowIndex === -1) return;

		// 現在の値を取得
		const currentParticipation =
			playerListData[playerRowIndex][participationColIndex];
		const currentAvgRank = playerListData[playerRowIndex][avgRankColIndex];
		const currentAvgScore = playerListData[playerRowIndex][avgScoreColIndex];
		const currentTotalIncome =
			playerListData[playerRowIndex][totalIncomeColIndex] || 0;

		// 新しい参加数
		const newParticipation = currentParticipation + 1;

		// 平均順位の更新
		const newAvgRank =
			(currentParticipation * currentAvgRank + ranks[index]) / newParticipation;

		// 平均得点（持ち点）の更新
		const newAvgScore =
			(currentParticipation * currentAvgScore + points[index]) /
			newParticipation;

		// 総合収支の更新
		const newTotalIncome = currentTotalIncome + incomes[index];

		// 値を更新
		sheet
			.getRange(playerRowIndex + 1, participationColIndex + 1)
			.setValue(newParticipation);
		sheet
			.getRange(playerRowIndex + 1, avgRankColIndex + 1)
			.setValue(newAvgRank);
		sheet
			.getRange(playerRowIndex + 1, avgScoreColIndex + 1)
			.setValue(newAvgScore);
		sheet
			.getRange(playerRowIndex + 1, totalIncomeColIndex + 1)
			.setValue(newTotalIncome);
	});
}

// 成績表に反映
function registerScoreTable(
	playerNames,
	points,
	ranks,
	eliminator,
	matchType,
	rating,
	bonusByRank,
) {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const sheet = ss.getSheetByName(SHEET_NAMES.SCORE_TABLE);

	const today = getToday(); // 日付の取得
	const lastMatch = sheet.getRange(3, 1, 1, 2).getValues()[0]; // 最終試合の日付と何半荘目を取得

	const matchNumber =
		formatDate(lastMatch[0]) === formatDate(today) ? lastMatch[1] + 1 : 1; // 何半荘目の計算

	const baseValues = [today, matchNumber, matchType, rating, bonusByRank];

	// 行を追加してからBASE値を入れる
	sheet.insertRowAfter(2);
	sheet.getRange(3, 1, 1, baseValues.length).setValues([baseValues]);

	// 未登録プレイヤーを検出して追加
	const unregisteredPlayers = getUnregisteredPlayers(playerNames);
	if (unregisteredPlayers.length > 0) {
		addPlayerColumnsToScoreTable(unregisteredPlayers);
	}

	// 各プレイヤーのカラム位置を取得
	const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
	const playerColumns = playerNames.map((name) => {
		const colIndex = headers.indexOf(name);
		return colIndex !== -1 ? colIndex + 1 : null;
	});

	// スコアの計算
	const scores = calculateScore(points, bonusByRank);
	const eliminationBonuses = calculateEliminationBonus(points, eliminator);
	const finalScores = scores.map(
		(score, index) => score + eliminationBonuses[index],
	);
	const incomes = calculateIncome(finalScores, rating);

	// 収支の合計が0になることを確認
	if (incomes.reduce((a, b) => a + b, 0) !== 0) {
		throw new Error("収支の合計が0ではありません");
	}

	// 各プレイヤーのデータを入力
	playerNames.forEach((name, index) => {
		const baseCol = playerColumns[index];
		if (baseCol !== null) {
			// 持ち点、スコア、収支を順に入力
			const values = [points[index], finalScores[index], incomes[index]];
			sheet.getRange(3, baseCol, 1, 3).setValues([values]);
		}
	});
	updatePlayerList(playerNames, points, ranks, incomes); // プレイヤー一覧の更新
}

// 日付をフォーマット
const formatDate = (date) => {
	return Utilities.formatDate(new Date(date), "JST", "yyyy-MM-dd");
};

// 飛ばし賞の計算
function calculateEliminationBonus(points, eliminator) {
	const ELIMINATION_BONUS = 10;
	const bonusScores = new Array(points.length).fill(0);

	// 飛ばした人（True）の数を数える
	const eliminatorCount = eliminator.filter(Boolean).length;
	// 箱下（マイナススコア）の人数を数える
	const negativeScoreCount = points.filter((point) => point < 0).length;

	if (eliminatorCount === 0 || negativeScoreCount === 0) {
		return bonusScores; // 飛ばした人がいない場合、または箱下がいない場合は何もしない
	}

	// 飛ばした人が複数人で箱下が1人の場合
	if (eliminatorCount > 1 && negativeScoreCount === 1) {
		const negativeScoreIndex = points.findIndex((point) => point < 0);
		// 箱下の人にマイナスボーナス（飛ばした人数 × ボーナス額）
		bonusScores[negativeScoreIndex] = -(eliminatorCount * ELIMINATION_BONUS);

		// 飛ばした人にそれぞれプラスボーナス
		eliminator.forEach((isEliminator, index) => {
			if (isEliminator) {
				bonusScores[index] = ELIMINATION_BONUS;
			}
		});
	}
	// 箱下が複数人の場合（テンパイ飛ばし）
	else if (negativeScoreCount > 1) {
		const totalPenalty = negativeScoreCount * ELIMINATION_BONUS;
		const bonusPerEliminator = totalPenalty / eliminatorCount;

		// 箱下の人々にマイナスボーナス
		points.forEach((point, index) => {
			if (point < 0) {
				bonusScores[index] = -ELIMINATION_BONUS;
			}
		});

		// 飛ばした人に分配
		eliminator.forEach((isEliminator, index) => {
			if (isEliminator) {
				bonusScores[index] = bonusPerEliminator;
			}
		});
	}
	// 通常の場合（飛ばした人が1人か、上記以外のケース）
	else {
		eliminator.forEach((isEliminator, index) => {
			if (isEliminator) {
				bonusScores[index] = ELIMINATION_BONUS;
			}
			if (points[index] < 0) {
				bonusScores[index] = -ELIMINATION_BONUS;
			}
		});
	}

	return bonusScores;
}

// 結果登録の実行関数
function executeRegister() {
	try {
		// 登録用シートからデータを取得
		const data = getRegisterData();

		// データの基本チェック
		if (!data.playerNames || data.playerNames.length === 0) {
			throw new Error("プレイヤーが登録されていません");
		}

		if (data.matchType === "四麻" && data.playerNames.length !== 4) {
			throw new Error("四麻の場合は4人のプレイヤーが必要です");
		}

		if (data.matchType === "三麻" && data.playerNames.length !== 3) {
			throw new Error("三麻の場合は3人のプレイヤーが必要です");
		}

		// 成績表とプレイヤー一覧に登録
		registerScoreTable(
			data.playerNames,
			data.points,
			data.ranks,
			data.eliminator,
			data.matchType,
			data.rating,
			data.bonusByRank,
		);

		// 登録完了メッセージを表示
		SpreadsheetApp.getActiveSpreadsheet().toast("登録が完了しました", "成功");

		// 登録用シートをクリア
		clearRegisterSheet();
	} catch (error) {
		// エラーメッセージを表示
		SpreadsheetApp.getActiveSpreadsheet().toast(error.message, "エラー");
		console.error("エラーが発生しました:", error);
	}
}

// 登録用シートのクリア
function clearRegisterSheet() {
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

function test() {
	console.log(
		// calculateScore([30000, 29000, 21000, 20000], "10 - 20"),
		// calculateIncome(
		// 	calculateScore([30000, 29000, 21000, 20000], "10 - 20"),
		// 	"テンニ",
		// ),
		// calculateScore([60000, 30000, 15000], "沈み10"),
		registerScoreTable(
			["あべ", "いしどう", "むらた", "ふかざわ"],
			[50000, 21000, 29000, -20000],
			[1, 2, 3, 4],
			[false, true, false, false],
			"四麻",
			"テンニ",
			"10 - 20",
		),
	);
}
