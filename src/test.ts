// テスト用のコード
function testEliminationBonus() {
	// テストケース1: 通常の飛ばし（1人が飛ばして、1人が箱下）
	console.log(
		"テストケース1:",
		calculateEliminationBonus(
			[2000, 1000, -1000, -2000],
			[true, false, false, false],
		),
	);

	// テストケース2: 複数人が飛ばして、1人が箱下
	console.log(
		"テストケース2:",
		calculateEliminationBonus(
			[2000, 1000, 500, -3500],
			[true, true, false, false],
		),
	);

	// テストケース3: テンパイ飛ばし（複数の箱下）
	console.log(
		"テストケース3:",
		calculateEliminationBonus(
			[2000, 1000, -1500, -1500],
			[true, false, false, false],
		),
	);
}

function testRegisterScoreTable() {
	// 四麻のテストケース（合計100000点）
	const yonmaTests = [
		{
			name: "四麻：通常パターン（飛ばしなし）",
			players: ["はつしか", "いしどう", "むらた", "ふかざわ"],
			points: [30000, 27000, 23000, 20000], // 合計100000
			ranks: [1, 2, 3, 4],
			eliminator: [false, false, false, false],
			matchType: "四麻",
			rating: "テンニ",
			bonusByRank: "10 - 20",
		},
		{
			name: "四麻：1人飛ばし1人箱下",
			players: ["はつしか", "いしどう", "むらた", "ふかざわ"],
			points: [40000, 35000, 35000, -10000], // 合計100000
			ranks: [1, 2, 3, 4],
			eliminator: [true, false, false, false],
			matchType: "四麻",
			rating: "テンニ",
			bonusByRank: "10 - 20",
		},
		{
			name: "四麻：複数人飛ばし1人箱下",
			players: ["はつしか", "いしどう", "むらた", "ふかざわ"],
			points: [45000, 45000, 30000, -20000], // 合計100000
			ranks: [1, 2, 3, 4],
			eliminator: [true, true, false, false],
			matchType: "四麻",
			rating: "テンニ",
			bonusByRank: "10 - 20",
		},
		{
			name: "四麻：テンパイ飛ばし（複数箱下）",
			players: ["はつしか", "いしどう", "むらた", "ふかざわ"],
			points: [60000, 45000, -2000, -3000], // 合計100000
			ranks: [1, 2, 3, 4],
			eliminator: [true, false, false, false],
			matchType: "四麻",
			rating: "テンニ",
			bonusByRank: "10 - 20",
		},
	];

	// 三麻のテストケース（合計105000点）
	const sanmaTests = [
		{
			name: "三麻：通常パターン（飛ばしなし）",
			players: ["はつしか", "いしどう", "むらた"],
			points: [40000, 35000, 30000], // 合計105000
			ranks: [1, 2, 3],
			eliminator: [false, false, false],
			matchType: "三麻",
			rating: "テンニ",
			bonusByRank: "順位10",
		},
		{
			name: "三麻：1人飛ばし1人箱下",
			players: ["はつしか", "いしどう", "むらた"],
			points: [65000, 45000, -5000], // 合計105000
			ranks: [1, 2, 3],
			eliminator: [true, false, false],
			matchType: "三麻",
			rating: "テンニ",
			bonusByRank: "順位10",
		},
		{
			name: "三麻：複数人飛ばし1人箱下",
			players: ["はつしか", "いしどう", "むらた"],
			points: [70000, 45000, -10000], // 合計105000
			ranks: [1, 2, 3],
			eliminator: [true, true, false],
			matchType: "三麻",
			rating: "テンニ",
			bonusByRank: "順位10",
		},
		{
			name: "三麻：沈みあり",
			players: ["はつしか", "いしどう", "むらた"],
			points: [75000, 20000, 10000], // 合計105000
			ranks: [1, 2, 3],
			eliminator: [false, false, false],
			matchType: "三麻",
			rating: "テンニ",
			bonusByRank: "沈み20",
		},
	];

	// テストの実行
	function runTests(tests) {
		tests.forEach((test) => {
			console.log("\n=== テスト実行:", test.name, "===");
			// 合計点数の確認
			const totalPoints = test.points.reduce((sum, point) => sum + point, 0);
			const expectedTotal = test.matchType === "四麻" ? 100000 : 105000;
			if (totalPoints !== expectedTotal) {
				console.error(
					`点数合計エラー: ${totalPoints} (期待値: ${expectedTotal})`,
				);
				return;
			}

			try {
				registerScoreTable(
					test.players,
					test.points,
					test.ranks,
					test.eliminator,
					test.matchType,
					test.rating,
					test.bonusByRank,
				);
				console.log("テスト成功:", test.name);
			} catch (error) {
				console.error("テスト失敗:", test.name, error);
			}
		});
	}

	console.log("\n=== 四麻テスト開始 ===");
	runTests(yonmaTests);

	console.log("\n=== 三麻テスト開始 ===");
	runTests(sanmaTests);
}

// テスト結果を確認するための補助関数
function validateTestResults() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const sheet = ss.getSheetByName(SHEET_NAMES.SCORE_TABLE);
	const lastRow = sheet.getLastRow();
	const lastCol = sheet.getLastColumn();
	const testData = sheet.getRange(3, 1, 1, lastCol).getValues()[0];

	console.log("最新の登録データ:");
	console.log("基本情報:", testData.slice(0, 5));

	// プレイヤーごとのデータを表示
	const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
	const playerData = {};
	let currentPlayer = null;

	headers.forEach((header, index) => {
		if (header && index >= 5) {
			if (SHEET_HEADERS.SCORE_TABLE_PLAYER.indexOf(header) === -1) {
				currentPlayer = header;
				playerData[currentPlayer] = [];
			} else if (currentPlayer) {
				playerData[currentPlayer].push(testData[index]);
			}
		}
	});

	console.log("プレイヤーデータ:", playerData);
}
