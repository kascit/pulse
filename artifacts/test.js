import bcrypt from "bcryptjs";

const password = "dhanur";
const saltRounds = 12;

const hash = await bcrypt.hash(password, saltRounds);
console.log(hash);
process.exit();
// ill keep this, forgot password, this is the update password lol