// 設定 Discord Webhook URL
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1458814909948100693/nVoFOIkWmCxdFuGsFaCR6IrKS3n5h7YOX_BNLUWy1Yf6djnnFQSSTg1Y-cjE6_LjBpc9";

function getSheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
}

// ----------------------------------------------------
// HTTP GET: 渲染網頁
// ----------------------------------------------------
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Token Generator')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ----------------------------------------------------
// HTTP POST: 驗證 Token (Endpoint 2)
// ----------------------------------------------------
function doPost(e) {
  let token = "";

  // 嘗試解析參數
  if (e.parameter && e.parameter.token) {
    token = e.parameter.token;
  } else if (e.postData && e.postData.contents) {
    try {
      const data = JSON.parse(e.postData.contents);
      token = data.token;
    } catch (err) {
      token = e.parameter.token;
    }
  }

  const result = verifyToken_(token);

  // 如果驗證失敗，發送 Discord 警告 (已移除 IP)
  if (!result.pass) {
    sendDiscordAlert_(`⚠️ **非法登入嘗試**\n有人嘗試使用無效或過期的 Token 登入。\n輸入 Token: \`${token || "空"}\``);
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ----------------------------------------------------
// 功能函數
// ----------------------------------------------------

function verifyToken_(inputToken) {
  if (!inputToken) return { pass: false, reason: "No token provided" };

  const sheet = getSheet_();
  const data = sheet.getDataRange().getValues();
  
  const now = new Date(); // 取得 Date 物件以便寫入
  const nowTime = now.getTime();

  // 定義時間常數 (毫秒)
  const FIVE_MINUTES = 5 * 60 * 1000;
  const SEVEN_MINUTES = 7 * 60 * 1000;

  for (let i = 1; i < data.length; i++) {
    const dbToken = data[i][2]; // Column C
    const dbTime = new Date(data[i][3]).getTime(); // Column D

    if (String(dbToken) === String(inputToken)) {
      const diff = nowTime - dbTime;

      // 情況 1: 超過 7 分鐘 -> 真的過期了
      if (diff > SEVEN_MINUTES) {
        return { pass: false, reason: "Token expired" };
      }

      // 情況 2: 介於 5~7 分鐘 -> 續約 (Renew)
      if (diff > FIVE_MINUTES) {
        // 更新該列的時間欄位 (Column D / Index 4) 為現在時間
        // sheet row index = i + 1 (因為 data 是從 0 開始的陣列)
        sheet.getRange(i + 1, 4).setValue(now);
        
        // 續約後視為通過，這裡可以選擇要不要 log 或發送通知
      }

      // 情況 3: 5 分鐘內 (或剛剛已續約) -> 通過
      return { pass: true };
    }
  }
  return { pass: false, reason: "Invalid token" };
}

function getUsersList() {
  const sheet = getSheet_();
  const data = sheet.getDataRange().getValues();
  let users = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][1]) {
      users.push(data[i][1]); 
    }
  }
  return users;
}

function handleGenerateToken(username) {
  const sheet = getSheet_();
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  let userId = "";

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] == username) {
      rowIndex = i + 1;
      userId = data[i][0]; // ID
      break;
    }
  }

  if (rowIndex === -1) throw new Error("User not found");

  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const timestamp = new Date();

  // 寫入 Token 和 Time
  sheet.getRange(rowIndex, 3).setValue(token);
  sheet.getRange(rowIndex, 4).setValue(timestamp);

  // 發送 Discord Webhook (已移除 IP)
  const discordMessage = `<@!${userId}> 你的Token是 ||${token}|| ， 請於5分鐘內登入`;
  
  sendDiscordAlert_(discordMessage);

  return "Success";
}

function sendDiscordAlert_(content) {
  const payload = { content: content };
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  };

  try {
    UrlFetchApp.fetch(DISCORD_WEBHOOK_URL, options);
  } catch (e) {
    Logger.log("Discord Webhook Error: " + e.toString());
  }
}