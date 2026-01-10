// ----------------------------------------------------
// HTTP GET: Render Web Page
// ----------------------------------------------------
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Token Generator')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ----------------------------------------------------
// HTTP POST: Verify Token (Endpoint 2)
// ----------------------------------------------------
// Users will access this Endpoint to verify Token
// Functionality has been split into Config.js, Utils.js, Auth.js, Users.js
function doPost(e) {
  const { token, ip } = parseRequestParams_(e);

  const result = verifyToken_(token);

  // If verification fails, send Discord alert
  if (!result.pass) {
    sendDiscordAlert_(`⚠️ **非法登入嘗試**\n有人嘗試使用無效或過期的 Token 登入。\n輸入 Token: \`${token || "空"}\`\n來源 IP: \`${ip}\``);
  } else {
    // Verification passed
    sendDiscordAlert_(`✅ IP \`${ip}\` 存取了網站`);
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}