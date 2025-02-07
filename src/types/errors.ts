// エラー型の定義
export class MahjongScorerError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "MahjongScorerError";
	}
}
