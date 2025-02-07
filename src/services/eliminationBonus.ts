import { EliminationBonusResult } from "../types/scoreTypes";
import { ELIMINATION_BONUS } from "../constants/gameConstants";

// 飛ばし賞の計算
export function calculateEliminationBonus(
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
