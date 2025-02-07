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
	matchType: MatchType; // 三麻/四麻
	rating: RatingKey; // レーティング
	bonusByRank: BonusByRankKey; // ウマ
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
	matchType: MatchType; // 三麻/四麻
	rating: RatingKey; // レーティング
	bonusByRank: BonusByRankKey; // ウマ
};

// 登録用データ
type RegisterData = {
	playerNames: string[];
	points: number[];
	ranks: number[];
	eliminator: boolean[];
	matchType: MatchType;
	rating: RatingKey;
	bonusByRank: BonusByRankKey;
};

// リテラル型の定義
type MatchType = "三麻" | "四麻";
type RatingKey = keyof typeof RATINGS;
type BonusByRankKey =
	| keyof typeof BONUS_BY_RANK.YONMA
	| keyof typeof BONUS_BY_RANK.SANMA;

// 登録用シートセル
const REGISTER_CELLS: {
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
const SHEET_NAMES: {
	readonly REGISTER: string;
	readonly SCORE_TABLE: string;
	readonly PLAYER_LIST: string;
} = {
	REGISTER: "登録用",
	SCORE_TABLE: "成績表",
	PLAYER_LIST: "プレイヤー一覧",
};

// ヘッダー用型定義
type SheetHeaders = {
	readonly SCORE_TABLE_BASE: readonly string[];
	readonly SCORE_TABLE_PLAYER: readonly string[];
	readonly PLAYER_LIST: readonly string[];
	readonly REGISTER: readonly string[];
};

// ヘッダー
const SHEET_HEADERS: SheetHeaders = {
	SCORE_TABLE_BASE: ["日付", "何半荘目", "三麻/四麻", "レート", "ウマ"],
	SCORE_TABLE_PLAYER: ["持ち点", "スコア", "収支"],
	PLAYER_LIST: ["ID", "名前", "参加数", "平均スコア", "平均順位", "総収支"],
	REGISTER: ["プレイヤー", "点数", "順位(自動入力)", "飛ばした人"],
};

// ウマ計算用の型定義
type BonusByRank = {
	readonly YONMA: {
		readonly [key: string]: readonly number[];
	};
	readonly SANMA: {
		readonly [key: string]: number[] | number;
	};
};

type BonusArray = readonly number[];

// ウマ
const BONUS_BY_RANK: BonusByRank = {
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
const RATINGS: { readonly [key: string]: number } = {
	"テンイチ": 10,
	"テンニ": 20,
	"テンサン": 30,
	"テンゴ": 50,
	"テンピン": 100,
};

// 飛ばし賞の定数
const ELIMINATION_BONUS = 10;

// スコア計算関連の型定義
type FinalScoreResult = {
	index: number;
	point: number;
};

type NonTopScore = {
	index: number;
	point: number;
};

type TopScore = {
	index: number;
	point: number;
};

type PlayerPointWithIndex = {
	index: number;
	point: number;
};

// スコア計算用の型定義
type PlayerPoint = {
	index: number;
	point: number;
};

type FinalScore = {
	index: number;
	point: number;
};

type PlayerUpdateInfo = {
	name: string;
	participation: number;
	avgRank: number;
	avgScore: number;
	totalIncome: number;
};

// 結果のための型定義
type EliminationBonusResult = number[];

// エラー型の定義
class MahjongScorerError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "MahjongScorerError";
	}
}

// プレイヤーが未登録の場合そのプレイヤーを含むリストを返す
function getUnregisteredPlayers(playerNameList: string[]): string[] {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const scoreTableHeaders = getScoreTableHeaders(ss);
	return playerNameList.filter(
		(name: string): boolean =>
			!scoreTableHeaders.some((header: string): boolean => header === name),
	);
}

// 成績表シートのヘッダーからプレイヤー名を取得
function getScoreTableHeaders(
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
function addPlayerColumnsToScoreTable(playerNames: string[]): void {
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
function calculateScore(
	playerPoints: number[],
	bonusByRank: BonusByRankKey,
): number[] {
	const playerPointsMap: PlayerPoint[] = playerPoints
		.map((point: number, index: number): PlayerPoint => ({ index, point }))
		.sort((a: PlayerPoint, b: PlayerPoint): number => b.point - a.point);

	const finalScores: FinalScore[] = calculateFinalScores(
		playerPointsMap,
		bonusByRank,
	);

	return finalScores
		.sort((a: FinalScore, b: FinalScore): number => a.index - b.index)
		.map((score: FinalScore): number => score.point);
}

// プレイヤー数に応じたスコア計算
function calculateFinalScores(
	playerPointsMap: PlayerPoint[],
	bonusByRank: BonusByRankKey,
): FinalScore[] {
	const playerCount = playerPointsMap.length;

	if (playerCount === 4) {
		return calculateYonmaScores(playerPointsMap, bonusByRank);
	} else if (playerCount === 3) {
		return calculateSanmaScores(playerPointsMap, bonusByRank);
	} else {
		throw new Error("プレイヤー数が不正です");
	}
}

// 四麻スコア計算（30000点返し）
function calculateYonmaScores(
	playerPointsMap: PlayerPoint[],
	bonusByRank: keyof typeof BONUS_BY_RANK.YONMA,
): FinalScore[] {
	const bonus = BONUS_BY_RANK.YONMA[bonusByRank];
	if (!bonus) {
		throw new Error("Invalid bonus configuration for Yonma");
	}

	const nonTopScores = calculateNonTopScores(
		playerPointsMap,
		30000,
		[...bonus],
		false,
	);

	const topScore = calculateTopScore(playerPointsMap[0], nonTopScores);
	return [topScore, ...nonTopScores];
}

// 三麻スコア計算（40000点返し）
function calculateSanmaScores(
	playerPointsMap: PlayerPoint[],
	bonusByRank: keyof typeof BONUS_BY_RANK.SANMA,
): FinalScore[] {
	const bonus = BONUS_BY_RANK.SANMA[bonusByRank];
	if (!bonus) {
		throw new Error("Invalid bonus configuration for Sanma");
	}

	const isSinking =
		typeof bonusByRank === "string" && bonusByRank.includes("沈み");
	const nonTopScores = calculateNonTopScores(
		playerPointsMap,
		40000,
		bonus,
		isSinking,
	);

	const topScore = calculateTopScore(playerPointsMap[0], nonTopScores);
	return [topScore, ...nonTopScores];
}

// 2位以下のスコア計算
function calculateNonTopScores(
	playerPointsMap: PlayerPoint[],
	basePoints: number,
	bonus: number[] | number,
	isSinking: boolean,
): FinalScore[] {
	return playerPointsMap.slice(1).map((player, index): FinalScore => {
		const bonusValue = isSinking
			? player.point < basePoints
				? -bonus
				: 0
			: Array.isArray(bonus)
				? bonus[index + 1]
				: 0;

		return {
			index: player.index,
			point: (player.point - basePoints) / 1000 + bonusValue,
		};
	});
}

// トップのスコアを他プレイヤーの合計の負値として計算
function calculateTopScore(
	topPlayer: PlayerPoint,
	nonTopScores: FinalScore[],
): FinalScore {
	return {
		index: topPlayer.index,
		point: -nonTopScores.reduce((sum, p) => sum + p.point, 0),
	};
}

// スコアから収支を計算
function calculateIncome(finalScores: number[], rating: RatingKey): number[] {
	const ratingValue: number | undefined = RATINGS[rating];
	if (ratingValue === undefined) {
		console.error("Invalid rating:", rating);
		return finalScores.map((): number => 0);
	}

	return finalScores.map((score: number): number => score * ratingValue);
}

// 登録用シートから結果と設定を取得
function getRegisterData(): RegisterData {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const sheet = ss.getSheetByName(SHEET_NAMES.REGISTER);

	// 設定項目の取得
	const matchType = sheet
		.getRange(REGISTER_CELLS.MATCH_TYPE)
		.getValue() as MatchType;
	const rating = sheet.getRange(REGISTER_CELLS.RATING).getValue() as RatingKey;
	const bonusByRankYonma = sheet
		.getRange(REGISTER_CELLS.BONUS_BY_RANK_YONMA)
		.getValue();
	const bonusByRankSanma = sheet
		.getRange(REGISTER_CELLS.BONUS_BY_RANK_SANMA)
		.getValue();
	const bonusByRank = (
		matchType === "三麻" ? bonusByRankSanma : bonusByRankYonma
	) as BonusByRankKey;

	let playerNames: string[] = [];
	let points: number[] = [];
	let ranks: number[] = [];
	let eliminator: boolean[] = [];

	const range =
		matchType === "四麻" ? REGISTER_CELLS.YONMA : REGISTER_CELLS.SANMA;
	const data = sheet.getRange(range).getValues();
	const validRows = data
		.slice(1)
		.filter((row: any[]): boolean => row[0] !== "");

	playerNames = validRows.map((row: any[]): string => row[0]);
	points = validRows.map((row: any[]): number => row[1]);
	ranks = validRows.map((row: any[]): number => row[2]);
	eliminator = validRows.map((row: any[]): boolean => row[3]);

	// 点数合計のチェック
	const expectedTotal = matchType === "四麻" ? 100000 : 105000;
	if (
		points.length > 0 &&
		points.reduce((a, b) => a + b, 0) !== expectedTotal
	) {
		throw new MahjongScorerError(`点数合計が${expectedTotal}ではありません`);
	}

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
function updatePlayerList(
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

// 成績表に反映
function registerScoreTable(
	playerNames: string[],
	points: number[],
	ranks: number[],
	eliminator: boolean[],
	matchType: MatchType,
	rating: RatingKey,
	bonusByRank: BonusByRankKey,
): void {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const sheet = ss.getSheetByName(SHEET_NAMES.SCORE_TABLE);

	if (!sheet) {
		throw new MahjongScorerError("成績表シートが見つかりません");
	}

	// データ検証
	if (
		!playerNames.length ||
		playerNames.length !== points.length ||
		points.length !== ranks.length ||
		ranks.length !== eliminator.length
	) {
		throw new MahjongScorerError("プレイヤーデータの長さが不正です");
	}

	const today = getToday();
	const lastMatch = sheet.getRange(3, 1, 1, 2).getValues()[0];
	const matchNumber =
		formatDate(lastMatch[0]) === formatDate(today) ? lastMatch[1] + 1 : 1;

	const baseValues = [today, matchNumber, matchType, rating, bonusByRank];

	// 未登録プレイヤーの処理
	const unregisteredPlayers = getUnregisteredPlayers(playerNames);
	if (unregisteredPlayers.length > 0) {
		addPlayerColumnsToScoreTable(unregisteredPlayers);
	}

	// ヘッダー取得とプレイヤー列の位置特定
	const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
	const playerColumns = playerNames.map((name: string): number => {
		const colIndex = headers.indexOf(name);
		if (colIndex === -1) {
			throw new MahjongScorerError(`プレイヤー「${name}」の列が見つかりません`);
		}
		return colIndex + 1;
	});

	// スコア計算
	const scores = calculateScore(points, bonusByRank);
	const eliminationBonuses = calculateEliminationBonus(points, eliminator);
	const finalScores = scores.map(
		(score: number, index: number): number => score + eliminationBonuses[index],
	);
	const incomes = calculateIncome(finalScores, rating);

	// 収支の合計チェック
	const totalIncome = incomes.reduce(
		(a: number, b: number): number => a + b,
		0,
	);
	if (Math.abs(totalIncome) > 0.001) {
		// 浮動小数点の誤差を考慮
		throw new MahjongScorerError("収支の合計が0ではありません");
	}

	// 新しい行の追加と基本データの入力
	sheet.insertRowAfter(2);
	sheet.getRange(3, 1, 1, baseValues.length).setValues([baseValues]);

	// プレイヤーデータの入力
	playerNames.forEach((name: string, index: number): void => {
		const baseCol = playerColumns[index];
		const values = [points[index], finalScores[index], incomes[index]];
		sheet.getRange(3, baseCol, 1, 3).setValues([values]);
	});

	// プレイヤー一覧の更新
	updatePlayerList(playerNames, points, ranks, incomes);
}

// 日付をフォーマット
function formatDate(date: string | Date): string {
	return Utilities.formatDate(
		typeof date === "string" ? new Date(date) : date,
		"JST",
		"yyyy-MM-dd",
	);
}

// 飛ばし賞の計算
function calculateEliminationBonus(
	points: readonly number[],
	eliminator: readonly boolean[],
): EliminationBonusResult {
	// 配列の長さチェック
	if (points.length !== eliminator.length) {
		throw new Error("points と eliminator の長さが一致しません");
	}

	// 結果配列の初期化
	const bonusScores: number[] = new Array(points.length).fill(0);

	// 飛ばした人（True）の数を数える
	const eliminatorCount: number = eliminator.filter(Boolean).length;
	// 箱下（マイナススコア）の人数を数える
	const negativeScoreCount: number = points.filter(
		(point: number): boolean => point < 0,
	).length;

	// 飛ばした人または箱下がいない場合は初期値を返す
	if (eliminatorCount === 0 || negativeScoreCount === 0) {
		return bonusScores;
	}

	// 飛ばした人が複数人で箱下が1人の場合
	if (eliminatorCount > 1 && negativeScoreCount === 1) {
		const negativeScoreIndex: number = points.findIndex(
			(point: number): boolean => point < 0,
		);

		// 箱下の人にマイナスボーナス（飛ばした人数 × ボーナス額）
		bonusScores[negativeScoreIndex] = -(eliminatorCount * ELIMINATION_BONUS);

		// 飛ばした人にそれぞれプラスボーナス
		eliminator.forEach((isEliminator: boolean, index: number): void => {
			if (isEliminator) {
				bonusScores[index] = ELIMINATION_BONUS;
			}
		});

		return bonusScores;
	}

	// 箱下が複数人の場合（テンパイ飛ばし）
	if (negativeScoreCount > 1) {
		const totalPenalty: number = negativeScoreCount * ELIMINATION_BONUS;
		const bonusPerEliminator: number =
			eliminatorCount > 0 ? totalPenalty / eliminatorCount : 0;

		// 箱下の人々にマイナスボーナス
		points.forEach((point: number, index: number): void => {
			if (point < 0) {
				bonusScores[index] = -ELIMINATION_BONUS;
			}
		});

		// 飛ばした人に分配
		eliminator.forEach((isEliminator: boolean, index: number): void => {
			if (isEliminator) {
				bonusScores[index] = bonusPerEliminator;
			}
		});

		return bonusScores;
	}

	// 通常の場合（飛ばした人が1人か、上記以外のケース）
	points.forEach((point: number, index: number): void => {
		if (eliminator[index]) {
			bonusScores[index] = ELIMINATION_BONUS;
		}
		if (point < 0) {
			bonusScores[index] = -ELIMINATION_BONUS;
		}
	});

	return bonusScores;
}

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

		// clearRegisterSheet(); // 登録用シートのクリア
	} catch (error) {
		if (error instanceof Error) {
			SpreadsheetApp.getActiveSpreadsheet().toast(error.message, "エラー");
			console.error("エラーが発生しました:", error);
		}
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
			[50000, 21000, 49000, -20000],
			[1, 3, 2, 4],
			[false, true, false, false],
			"四麻",
			"テンニ",
			"10 - 20",
		),
	);
}
