import {
	RegisterData,
	RatingKey,
	BonusByRankKey,
	MatchType,
} from "../types/configTypes";
import { SHEET_NAMES, REGISTER_CELLS } from "../constants/sheetConstants";
import { MahjongScorerError } from "../types/errors";
import { getToday, formatDate } from "../utils/dateUtils";
import { getUnregisteredPlayers } from "../utils/validationUtils";
import { addPlayerColumnsToScoreTable } from "../utils/sheetUtils";
import { updatePlayerList } from "../services/playerManager";
import { calculateIncome, calculateScore } from "../services/scoreCalculator";
import { calculateEliminationBonus } from "../services/eliminationBonus";

// 登録用シートから結果と設定を取得
export function getRegisterData(): RegisterData {
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

// 成績表に反映
export function registerScoreTable(
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
