const bcrypt = require('bcryptjs');

const hash = bcrypt.hashSync('passer123', 12);
console.log(hash);