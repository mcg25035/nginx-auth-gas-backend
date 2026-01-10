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
