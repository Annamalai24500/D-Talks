const Pool = require('pg').Pool;
require('dotenv').config();
const pool = new Pool({
    user:'postgres',
    password:process.env.PASSWORD,
    host:'localhost',
    port:5432,
    database:'dtalks'
});
console.log(pool.query('SELECT NOW()'));
console.log('Postgres connected');
module.exports = pool;