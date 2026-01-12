// ----------------------------------------------------
// HTTP GET: Handle userId Query
// ----------------------------------------------------
function doGet(e) {
  // Early return: no userId parameter provided
  if (!e?.parameter?.userId) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "userId parameter is required"
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }

  const userId = e.parameter.userId;

  try {
    const sheet = getSheet_();
    const data = sheet.getDataRange().getValues();
    
    // Search for user by ID (Column A)
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(userId)) {
        const username = data[i][1]; // Username from Column B
        
        // User exists, trigger token generation using existing function
        handleGenerateToken(username);
        
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: "Token generated successfully"
        }))
        .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // Early return: User not found
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "User not found"
    }))
    .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Early return: Error handling
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Error: " + error.message
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

// ----------------------------------------------------
// HTTP POST: Verify Token (Endpoint 2)
// ----------------------------------------------------
// Users will access this Endpoint to verify Token
// Functionality has been split into Config.js, Utils.js, Auth.js, Users.js
function doPost(e) {
  const { token, ip, role, url } = parseRequestParams_(e);

  const result = verifyToken_(token, role);

  // Common Embed Fields
  const embed = {
    fields: [
      { name: "來源 IP", value: `\`${ip}\`` },
      { name: "訪問網址", value: url }
    ],
    footer: { text: "GAS Auth System" },
    timestamp: new Date().toISOString()
  };

  // If verification fails, send Discord alert
  if (!result.pass) {
    embed.color = 0xED4245; // Red
    if (result.userId) {
      // Valid User, Invalid Role
      embed.title = "⚠️ 無權限存取";
      embed.description = "使用者嘗試訪問不具備權限的網站。";
      embed.fields.unshift({ name: "使用者", value: `<@!${result.userId}>` });
    } else {
      // Invalid Token
      embed.title = "⚠️ 非法登入嘗試";
      embed.description = "有人嘗試使用無效或過期的 Token 登入。";
    }
  } else {
    // Verification passed
    embed.color = 0x57F287; // Green
    embed.title = result.renewed ? "⏳ 登入延長" : "✅ 登入成功";
    embed.fields.unshift({ name: "使用者", value: `<@!${result.userId}>` });
  }

  // Send Alert with Embed (Content is optional, using empty string or simple notification text)
  sendDiscordAlert_("", embed);

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}