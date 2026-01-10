// ----------------------------------------------------
// Utility Functions
// ----------------------------------------------------

function getSheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
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

/**
 * Parses the request event to extract parameters.
 * Prioritizes Query Parameters, then JSON Body.
 * @param {Object} e - The event object.
 * @return {Object} An object containing token and ip.
 */
function parseRequestParams_(e) {
  // 1. Try Query Parameters first (if token exists)
  // This matches original logic: if param token exists, use it and ignore body.
  if (e?.parameter?.token) {
    return {
      token: e.parameter.token,
      ip: e.parameter.ip || "Unknown IP"
    };
  }

  // 2. Try JSON Body
  if (e?.postData?.contents) {
    try {
      const data = JSON.parse(e.postData.contents);
      return {
        token: data.token || "",
        ip: data.ip || "Unknown IP"
      };
    } catch (err) {
      // JSON parse failed, fall through to default
    }
  }

  // 3. Last resort: check params again (e.g. for IP only if token missing) or defaults
  return {
    token: e?.parameter?.token || "",
    ip: e?.parameter?.ip || "Unknown IP"
  };
}
