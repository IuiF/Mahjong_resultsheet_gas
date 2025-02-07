// 実行した日時 YY-MM-DDを返す
export function getToday() {
	const today = new Date();
	const year = today.getFullYear();
	const month = ("0" + (today.getMonth() + 1)).slice(-2);
	const date = ("0" + today.getDate()).slice(-2);
	const formattedDate = year + "-" + month + "-" + date;
	return formattedDate;
}

// 日付をフォーマット
export function formatDate(date: string | Date): string {
	return Utilities.formatDate(
		typeof date === "string" ? new Date(date) : date,
		"JST",
		"yyyy-MM-dd",
	);
}
