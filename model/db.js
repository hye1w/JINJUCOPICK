let sql = require('mysql');

let db = sql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'jjcp'
})

db.connect((e)=>{
    if(e) throw e;
    console.log('DB성공')
})

module.exports = db;