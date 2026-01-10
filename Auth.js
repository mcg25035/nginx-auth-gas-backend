// ----------------------------------------------------
// Verification and Token Functions
// ----------------------------------------------------

function verifyToken_(inputToken) {
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

      // Case 1: Over 7 minutes -> Really expired
      if (diff > SEVEN_MINUTES) {
        return { pass: false, reason: "Token expired" };
      }

      // Case 2: Between 5-7 minutes -> Renew
      if (diff > FIVE_MINUTES) {
        // Update the time column (Column D / Index 4) to now
        // sheet row index = i + 1 (because data is a 0-indexed array)
        sheet.getRange(i + 1, 4).setValue(now);
        
        // Treated as valid after renewal, logging or notification can be added here
      }

      // Case 3: Within 5 minutes (or just renewed) -> Pass
      return { pass: true };
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

  // Send Discord Webhook (IP removed)
  const discordMessage = `<@!${userId}> 你的Token是 ||${token}|| ， 請於5分鐘內登入`;
  
  sendDiscordAlert_(discordMessage);

  return "Success";
}
