// ----------------------------------------------------
// Verification and Token Functions
// ----------------------------------------------------

function verifyToken_(inputToken, expectedRole) {
  if (!inputToken) return { pass: false, reason: "No token provided" };

  const sheet = getSheet_();
  const data = sheet.getDataRange().getValues();
  
  const now = new Date(); // Get Date object for writing
  const nowTime = now.getTime();

  for (let i = 1; i < data.length; i++) {
    const dbToken = data[i][2]; // Column C
    const dbTime = new Date(data[i][3]).getTime(); // Column D

    if (String(dbToken) === String(inputToken)) {
      const diff = nowTime - dbTime;
      let isRenewed = false;

      // Case 1: Over 7 minutes -> Really expired
      if (diff > TWO_HOURS) {
        return { pass: false, reason: "Token expired" };
      }

      // Case 2: Between 5-7 minutes -> Renew
      if (diff > ONE_HOURS) {
        // Update the time column (Column D / Index 4) to now
        // sheet row index = i + 1 (because data is a 0-indexed array)
        sheet.getRange(i + 1, 4).setValue(now);
        isRenewed = true;
      }

      // Case 3: Within 5 minutes (or just renewed) -> Pass
      if (expectedRole) {
        const userRoles = String(data[i][4] || ""); // Column E
        const userRolesArray = userRoles.split(",");
        const requiredRolesArray = expectedRole.split(",");
        
        // Check if user has ANY of the required roles
        const hasRole = requiredRolesArray.some(req => userRolesArray.includes(req));
        
        if (!hasRole) {
          return {
            pass: false,
            reason: `User verification passed but missing any of required roles: ${expectedRole}`,
            username: data[i][1], // Return username (Column B)
            userId: data[i][0]    // Return userId (Column A)
          };
        }
      }
      // Return username (Column B -> index 1)
      return { pass: true, username: data[i][1], userId: data[i][0], renewed: isRenewed };
    }
  }
  return { pass: false, reason: "Invalid token" };
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

  // Write Token and Time
  sheet.getRange(rowIndex, 3).setValue(token);
  sheet.getRange(rowIndex, 4).setValue(timestamp);

  // Send Token via API
  try {
    const payload = {
      "token": token,
      "user-id": userId
    };
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload)
    };
    UrlFetchApp.fetch(SEND_TOKEN_URL, options);
  } catch (e) {
    Logger.log("Error sending token: " + e.toString());
    throw new Error("Failed to send token");
  }

  return "Success";
}
