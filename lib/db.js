const { Datastore } = require("nedb-async-await");

// Соединение с базой данных
exports.users =   Datastore({filename:  'db/users',   autoload: true});
exports.changes = Datastore({filename:  'db/changes', autoload: true});
exports.lessons = Datastore({filename:  'db/lessons', autoload: true});
exports.isslog =  Datastore({filename:  'db/isslog',  autoload: true});
