// src/index.ts
var REGISTER_CELLS = {
  YONMA: "A2:D6",
  SANMA: "A9:D12",
  MATCH_TYPE: "B16",
  RATING: "B17",
  BONUS_BY_RANK_SANMA: "B18",
  BONUS_BY_RANK_YONMA: "B19"
};
var SHEET_NAMES = {
  REGISTER: "登録用",
  SCORE_TABLE: "成績表",
  PLAYER_LIST: "プレイヤー一覧"
};
var SHEET_HEADERS = {
  SCORE_TABLE_BASE: ["日付", "何半荘目", "三麻/四麻", "レート", "ウマ"],
  SCORE_TABLE_PLAYER: ["持ち点", "スコア", "収支"],
  PLAYER_LIST: ["ID", "名前", "参加数", "平均スコア", "平均順位", "総収支"],
  REGISTER: ["プレイヤー", "点数", "順位(自動入力)", "飛ばした人"]
};
var BONUS_BY_RANK = {
  YONMA: {
    "5 - 10": [10, 5, -5, -10],
    "10 - 20": [20, 10, -10, -20],
    "10 - 30": [30, 10, -10, -30],
    "20 - 30": [30, 20, -20, -30]
  },
  SANMA: {
    "順位5": [5, 0, -5],
    "順位10": [10, 0, -10],
    "順位20": [20, 0, -20],
    "沈み10": 10,
    "沈み20": 20
  }
};
var RATINGS = {
  "テンイチ": 10,
  "テンニ": 20,
  "テンサン": 30,
  "テンゴ": 50,
  "テンピン": 100
};
function getUnregisteredPlayers(playerNameList) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const scoreTableHeaders = getScoreTableHeaders(ss);
  return playerNameList.filter(function(name) {
    return !scoreTableHeaders.some(function(header) {
      return header === name;
    });
  });
}
function getScoreTableHeaders(ss) {
  const sheet = ss.getSheetByName(SHEET_NAMES.SCORE_TABLE);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return headers.slice(SHEET_HEADERS.SCORE_TABLE_BASE.length).filter(function(v) {
    return v !== "";
  }).filter(function(v, i, self) {
    return self.indexOf(v) === i;
  });
}
function addPlayerColumnsToScoreTable(playerNames) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.SCORE_TABLE);
  var currentColumn = sheet.getLastColumn();
  playerNames.forEach(function(name) {
    sheet.insertColumnsAfter(currentColumn, 3);
    sheet.getRange(1, currentColumn + 1, 1, 3).merge();
    sheet.getRange(1, currentColumn + 1).setValue(name);
    sheet.getRange(2, currentColumn + 1, 1, 3).setValues([SHEET_HEADERS.SCORE_TABLE_PLAYER]);
    currentColumn += 3;
  });
}
function getToday() {
  const today = /* @__PURE__ */ new Date();
  const year = today.getFullYear();
  const month = ("0" + (today.getMonth() + 1)).slice(-2);
  const date = ("0" + today.getDate()).slice(-2);
  const formattedDate = year + "-" + month + "-" + date;
  return formattedDate;
}
function calculateScore(playerPoints, bonusByRank) {
  const playerPointsMap = playerPoints.map((point, index) => ({ index, point })).sort((a, b) => b.point - a.point);
  const finalScores = calculateFinalScores(playerPointsMap, bonusByRank);
  return finalScores.sort((a, b) => a.index - b.index).map((score) => score.point);
}
function calculateFinalScores(playerPointsMap, bonusByRank) {
  const playerCount = playerPointsMap.length;
  if (playerCount === 4) {
    return calculateYonmaScores(playerPointsMap, bonusByRank);
  } else if (playerCount === 3) {
    return calculateSanmaScores(playerPointsMap, bonusByRank);
  }
  throw new Error("プレイヤー数が不正です");
}
function calculateYonmaScores(playerPointsMap, bonusByRank) {
  const bonus = BONUS_BY_RANK.YONMA[bonusByRank];
  const nonTopScores = calculateNonTopScores(
    playerPointsMap,
    3e4,
    bonus,
    false
  );
  return [calculateTopScore(playerPointsMap[0], nonTopScores), ...nonTopScores];
}
function calculateSanmaScores(playerPointsMap, bonusByRank) {
  const bonus = BONUS_BY_RANK.SANMA[bonusByRank];
  const isSinking = bonusByRank.startsWith("沈み");
  const nonTopScores = calculateNonTopScores(
    playerPointsMap,
    4e4,
    bonus,
    isSinking
  );
  return [calculateTopScore(playerPointsMap[0], nonTopScores), ...nonTopScores];
}
function calculateNonTopScores(playerPointsMap, basePoints, bonus, isSinking) {
  return playerPointsMap.slice(1).map((player, index) => ({
    index: player.index,
    point: (player.point - basePoints) / 1e3 + (isSinking ? player.point < basePoints ? -bonus : 0 : bonus[index + 1])
  }));
}
function calculateTopScore(topPlayer, nonTopScores) {
  return {
    index: topPlayer.index,
    point: -nonTopScores.reduce((sum, p) => sum + p.point, 0)
  };
}
function calculateIncome(finalScores, rating) {
  const ratingValue = RATINGS[rating];
  if (ratingValue === void 0) {
    console.error("Invalid rating:", rating);
    return finalScores.map(() => 0);
  }
  const result = finalScores.map((score) => score * ratingValue);
  return result;
}
function getRegisterData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.REGISTER);
  const matchType = sheet.getRange(REGISTER_CELLS.MATCH_TYPE).getValue();
  const rating = sheet.getRange(REGISTER_CELLS.RATING).getValue();
  const bonusByRankYonma = sheet.getRange(REGISTER_CELLS.BONUS_BY_RANK_YONMA).getValue();
  const bonusByRankSanma = sheet.getRange(REGISTER_CELLS.BONUS_BY_RANK_SANMA).getValue();
  const bonusByRank = matchType === "三麻" ? bonusByRankSanma : bonusByRankYonma;
  let playerNames = [];
  let points = [];
  let ranks = [];
  let eliminator = [];
  if (matchType === "四麻") {
    const data = sheet.getRange(REGISTER_CELLS.YONMA).getValues();
    const validRows = data.slice(1).filter((row) => row[0] !== "");
    playerNames = validRows.map((row) => row[0]);
    points = validRows.map((row) => row[1]);
    ranks = validRows.map((row) => row[2]);
    eliminator = validRows.map((row) => row[3]);
    if (points.length > 0 && points.reduce((a, b) => a + b, 0) !== 1e5) {
      throw new Error("点数合計が100000ではありません");
    }
  } else {
    const data = sheet.getRange(REGISTER_CELLS.SANMA).getValues();
    const validRows = data.slice(1).filter((row) => row[0] !== "");
    playerNames = validRows.map((row) => row[0]);
    points = validRows.map((row) => row[1]);
    ranks = validRows.map((row) => row[2]);
    eliminator = validRows.map((row) => row[3]);
    if (points.length > 0 && points.reduce((a, b) => a + b, 0) !== 105e3) {
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
    bonusByRank
  });
  return {
    playerNames,
    points,
    ranks,
    eliminator,
    matchType,
    rating,
    bonusByRank
  };
}
function updatePlayerList(playerNames, points, ranks, incomes) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.PLAYER_LIST);
  const playerListData = sheet.getDataRange().getValues();
  const headerRow = playerListData[0];
  const nameColIndex = headerRow.indexOf("名前");
  const participationColIndex = headerRow.indexOf("参加数");
  const avgRankColIndex = headerRow.indexOf("平均順位");
  const avgScoreColIndex = headerRow.indexOf("平均得点");
  const totalIncomeColIndex = headerRow.indexOf("総合収支");
  playerNames.forEach((playerName, index) => {
    const playerRowIndex = playerListData.findIndex(
      (row) => row[nameColIndex] === playerName
    );
    if (playerRowIndex === -1) return;
    const currentParticipation = playerListData[playerRowIndex][participationColIndex];
    const currentAvgRank = playerListData[playerRowIndex][avgRankColIndex];
    const currentAvgScore = playerListData[playerRowIndex][avgScoreColIndex];
    const currentTotalIncome = playerListData[playerRowIndex][totalIncomeColIndex] || 0;
    const newParticipation = currentParticipation + 1;
    const newAvgRank = (currentParticipation * currentAvgRank + ranks[index]) / newParticipation;
    const newAvgScore = (currentParticipation * currentAvgScore + points[index]) / newParticipation;
    const newTotalIncome = currentTotalIncome + incomes[index];
    sheet.getRange(playerRowIndex + 1, participationColIndex + 1).setValue(newParticipation);
    sheet.getRange(playerRowIndex + 1, avgRankColIndex + 1).setValue(newAvgRank);
    sheet.getRange(playerRowIndex + 1, avgScoreColIndex + 1).setValue(newAvgScore);
    sheet.getRange(playerRowIndex + 1, totalIncomeColIndex + 1).setValue(newTotalIncome);
  });
}
function registerScoreTable(playerNames, points, ranks, eliminator, matchType, rating, bonusByRank) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.SCORE_TABLE);
  const today = getToday();
  const lastMatch = sheet.getRange(3, 1, 1, 2).getValues()[0];
  const matchNumber = formatDate(lastMatch[0]) === formatDate(today) ? lastMatch[1] + 1 : 1;
  const baseValues = [today, matchNumber, matchType, rating, bonusByRank];
  sheet.insertRowAfter(2);
  sheet.getRange(3, 1, 1, baseValues.length).setValues([baseValues]);
  const unregisteredPlayers = getUnregisteredPlayers(playerNames);
  if (unregisteredPlayers.length > 0) {
    addPlayerColumnsToScoreTable(unregisteredPlayers);
  }
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const playerColumns = playerNames.map((name) => {
    const colIndex = headers.indexOf(name);
    return colIndex !== -1 ? colIndex + 1 : null;
  });
  const scores = calculateScore(points, bonusByRank);
  const eliminationBonuses = calculateEliminationBonus(points, eliminator);
  const finalScores = scores.map(
    (score, index) => score + eliminationBonuses[index]
  );
  const incomes = calculateIncome(finalScores, rating);
  if (incomes.reduce((a, b) => a + b, 0) !== 0) {
    throw new Error("収支の合計が0ではありません");
  }
  playerNames.forEach((name, index) => {
    const baseCol = playerColumns[index];
    if (baseCol !== null) {
      const values = [points[index], finalScores[index], incomes[index]];
      sheet.getRange(3, baseCol, 1, 3).setValues([values]);
    }
  });
  updatePlayerList(playerNames, points, ranks, incomes);
}
var formatDate = (date) => {
  return Utilities.formatDate(new Date(date), "JST", "yyyy-MM-dd");
};
function calculateEliminationBonus(points, eliminator) {
  const ELIMINATION_BONUS = 10;
  const bonusScores = new Array(points.length).fill(0);
  const eliminatorCount = eliminator.filter(Boolean).length;
  const negativeScoreCount = points.filter((point) => point < 0).length;
  if (eliminatorCount === 0 || negativeScoreCount === 0) {
    return bonusScores;
  }
  if (eliminatorCount > 1 && negativeScoreCount === 1) {
    const negativeScoreIndex = points.findIndex((point) => point < 0);
    bonusScores[negativeScoreIndex] = -(eliminatorCount * ELIMINATION_BONUS);
    eliminator.forEach((isEliminator, index) => {
      if (isEliminator) {
        bonusScores[index] = ELIMINATION_BONUS;
      }
    });
  } else if (negativeScoreCount > 1) {
    const totalPenalty = negativeScoreCount * ELIMINATION_BONUS;
    const bonusPerEliminator = totalPenalty / eliminatorCount;
    points.forEach((point, index) => {
      if (point < 0) {
        bonusScores[index] = -ELIMINATION_BONUS;
      }
    });
    eliminator.forEach((isEliminator, index) => {
      if (isEliminator) {
        bonusScores[index] = bonusPerEliminator;
      }
    });
  } else {
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
function executeRegister() {
  try {
    const data = getRegisterData();
    if (!data.playerNames || data.playerNames.length === 0) {
      throw new Error("プレイヤーが登録されていません");
    }
    if (data.matchType === "四麻" && data.playerNames.length !== 4) {
      throw new Error("四麻の場合は4人のプレイヤーが必要です");
    }
    if (data.matchType === "三麻" && data.playerNames.length !== 3) {
      throw new Error("三麻の場合は3人のプレイヤーが必要です");
    }
    registerScoreTable(
      data.playerNames,
      data.points,
      data.ranks,
      data.eliminator,
      data.matchType,
      data.rating,
      data.bonusByRank
    );
    SpreadsheetApp.getActiveSpreadsheet().toast("登録が完了しました", "成功");
    clearRegisterSheet();
  } catch (error) {
    SpreadsheetApp.getActiveSpreadsheet().toast(error.message, "エラー");
    console.error("エラーが発生しました:", error);
  }
}
function clearRegisterSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.REGISTER);
  sheet.getRange(REGISTER_CELLS.YONMA).offset(1, 0, 4, 2).clearContent();
  sheet.getRange(REGISTER_CELLS.SANMA).offset(1, 0, 3, 2).clearContent();
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
      [5e4, 21e3, 29e3, -2e4],
      [1, 2, 3, 4],
      [false, true, false, false],
      "四麻",
      "テンニ",
      "10 - 20"
    )
  );
}
