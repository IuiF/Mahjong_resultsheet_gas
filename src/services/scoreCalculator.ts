import { BonusByRankKey, RatingKey } from "../types/configTypes";
import { PlayerPoint, FinalScore } from "../types/scoreTypes";
import { BONUS_BY_RANK, RATINGS } from "../constants/gameConstants";

// スコア計算
export function calculateScore(
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
export function calculateFinalScores(
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
export function calculateYonmaScores(
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
export function calculateSanmaScores(
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
export function calculateNonTopScores(
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
export function calculateTopScore(
	topPlayer: PlayerPoint,
	nonTopScores: FinalScore[],
): FinalScore {
	return {
		index: topPlayer.index,
		point: -nonTopScores.reduce((sum, p) => sum + p.point, 0),
	};
}

// スコアから収支を計算
export function calculateIncome(
	finalScores: number[],
	rating: RatingKey,
): number[] {
	const ratingValue: number | undefined = RATINGS[rating];
	if (ratingValue === undefined) {
		console.error("Invalid rating:", rating);
		return finalScores.map((): number => 0);
	}

	return finalScores.map((score: number): number => score * ratingValue);
}
