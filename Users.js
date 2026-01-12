// ----------------------------------------------------
// User Related Functions
// ----------------------------------------------------


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

/**
 * Syncs user roles from external API to rc-service-auth sheet.
 * Triggered by time-driven trigger.
 */
function syncUserRoles() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const roleSheet = ss.getSheetByName("role-list");
  const authSheet = ss.getSheetByName("rc-service-auth");

  if (!roleSheet || !authSheet) {
    Logger.log("Error: Required sheets not found.");
    return;
  }

  // 1. Get roles from role-list (Column A)
  const roleData = roleSheet.getRange("A2:A").getValues();
  // Filter out empty roles
  const roles = roleData.map(r => r[0]).filter(r => r !== "");

  // 2. Fetch users for each role from API and aggregate
  // Map<UserID, UserObject> where UserObject = { id, username, roles: Set }
  const usersMap = new Map();

  roles.forEach(role => {
    try {
      const response = UrlFetchApp.fetch(USER_API_BASE + role);
      if (response.getResponseCode() === 200) {
        const users = JSON.parse(response.getContentText());
        
        // User reports format: { "userId": "username", ... }
        if (typeof users === 'object' && users !== null && !Array.isArray(users)) {
           Object.entries(users).forEach(([id, username]) => {
             const userId = String(id);
             if (usersMap.has(userId)) {
               // User exists, append role
               usersMap.get(userId).roles.add(role);
               // Update username
               usersMap.get(userId).username = username;
             } else {
               // New user
               usersMap.set(userId, {
                 id: userId,
                 username: username,
                 roles: new Set([role])
               });
             }
           });
        }
      }
    } catch (e) {
      Logger.log(`Error fetching role ${role}: ${e.toString()}`);
    }
  });

  // 3. Update rc-service-auth
  // Layout: ID(A), Username(B), Token(C), Time(D), Role(E)
  const lastRow = authSheet.getLastRow();
  let existingData = [];
  if (lastRow > 1) {
    // Read existing data (Columns A to E)
    existingData = authSheet.getRange(2, 1, lastRow - 1, 5).getValues();
  }

  // Track processed IDs
  const existingIds = new Set();
  
  // Update existing rows
  const updatedData = existingData.map(row => {
    const id = String(row[0]);
    existingIds.add(id);
    
    if (usersMap.has(id)) {
      const newUser = usersMap.get(id);
      
      // Update Username (Col B -> index 1)
      row[1] = newUser.username;
      
      // Update Role (Col E -> index 4). Join roles with comma.
      // Convert Set to Array and join
      row[4] = Array.from(newUser.roles).join(",");
      
      // Token (row[2]) and Time (row[3]) are PRESERVED automatically 
      // because we are modifying the 'row' array which came from 'existingData'.
    }
    return row;
  });

  // Write updated data back
  if (updatedData.length > 0) {
    authSheet.getRange(2, 1, updatedData.length, 5).setValues(updatedData);
  }

  // Append new users
  const newRows = [];
  usersMap.forEach((u, id) => {
    if (!existingIds.has(id)) {
      // ID, Username, Token, Time, Role
      // Token and Time explicitly empty for new users
      newRows.push([id, u.username, "", "", Array.from(u.roles).join(",")]);
    }
  });

  if (newRows.length > 0) {
    authSheet.getRange(lastRow + 1, 1, newRows.length, 5).setValues(newRows);
  }

  Logger.log(`Synced ${usersMap.size} users. Updated ${existingIds.size}, Appended ${newRows.length}.`);
}

