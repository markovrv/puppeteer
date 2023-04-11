const express = require('express');
const common = require("./lib/common")
// Параметры запуска: Перед выгрузкой на сервер закомментировать строку
common.app_env = 'local'
const iss = require("./routes/iss.route")
const strasp = require("./routes/strasp.route")
const userrasp = require("./routes/rasp.route")
const kabrasp = require("./routes/kabrasp.route")
const lk = require("./routes/lk.route")
const db = require("./routes/db.route")
const cors = require("./middleware/cors.middleware")


common.init()
const app = express();
if (common.app_env == 'local') app.use(express.static('vue/dist'));
else app.use(express.static('app'));

app.use(cors);

app.use('/api/iss', iss)
app.use('/api/stud', strasp)
app.use('/api/rasp', userrasp)
app.use('/api/kab', kabrasp)
app.use('/api/lk', lk)
app.use('/api/db', db)


app.listen(3333, () => { console.log('Сервер запущен на http://localhost:3333/') })