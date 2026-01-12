// ----------------------------------------------------
// Utility Functions
// ----------------------------------------------------

function getSheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
}

function sendDiscordAlert_(content, embed) {
  const payload = {};
  if (content) payload.content = content;
  if (embed) payload.embeds = [embed];

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
 * @return {Object} An object containing token, ip, and url.
 */
function parseRequestParams_(e) {
  // 1. Try Query Parameters first (if token exists)
  // This matches original logic: if param token exists, use it and ignore body.
  if (e?.parameter?.token) {
    return {
      token: e.parameter.token,
      role: e.parameter.role || null,
      ip: e.parameter.ip || "Unknown IP",
      url: e.parameter.url || e.parameter.referer || e.parameter.refer || "Unknown URL"
    };
  }

  // 2. Try JSON Body
  if (e?.postData?.contents) {
    try {
      const data = JSON.parse(e.postData.contents);
      return {
        token: data.token || "",
        role: data.role || null,
        ip: data.ip || "Unknown IP",
        url: data.url || data.referer || data.refer || "Unknown URL"
      };
    } catch (err) {
      // JSON parse failed, fall through to default
    }
  }

  // 3. Last resort: check params again (e.g. for IP only if token missing) or defaults
  return {
    token: e?.parameter?.token || "",
    role: e?.parameter?.role || null,
    ip: e?.parameter?.ip || "Unknown IP",
    url: e?.parameter?.url || e?.parameter?.referer || e?.parameter?.refer || "Unknown URL"
  };
}
