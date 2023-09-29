const { Datastore } = require("nedb-async-await");
const mysql = require("mysql2");
const config = require('../config');

var connection = null
var lastq = 0

var start = (cb) => {
    if (!connection){
        connection = mysql.createConnection(config.db);
        connection.connect(e => {
            if (e) console.error(e);
            else {
                cb(connection)
                console.log("Соединение с БД открыто")
            }
        });
    } else try {
        cb(connection)
    } catch(err) {
        console.log(err)
        connection = null
    }
        
    lastq = Date.now()
}

setInterval(() => {
    var now = Date.now()
    if (connection && now - lastq > 600000) {
        connection.end()
        connection = null
        console.log("Соединение с БД закрыто")
    }
}, 30000);

var end = () => {
    lastq = Date.now()
}

var getGroupsArr = groups => {
    var g
    try {
        g = JSON.parse(groups)
        return g
    } catch {
        console.log(groups)
        return []
    }
}

var lessonMap = res => ({
    _id: res.id,
    login: res.login,
    type: res.type,
    day: res.day,
    time: res.time,
    lesson: {
        time: res.time,
        predm: res.predm,
        type: res.ptype,
        kab: res.kab,
        groups: getGroupsArr(res.groups)
    },
    date: res.date
})

exports.lessons = {
    insert: d => {
        return new Promise((resolve, reject) => {
            start(connection => {
                const sql = 'INSERT INTO `lessons` (`id`, `login`, `type`, `day`, `time`, `predm`, `ptype`, `kab`, `groups`, `date`) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ? );';
                connection.query(sql, [d.login, d.type, d.day, d.time, d.lesson.predm, d.lesson.type, d.lesson.kab, JSON.stringify(d.lesson.groups), d.date],
                    (err, results) => {
                        if (err) reject(err)
                        else resolve(results)
                        end()
                    }
                );
            })
        })
    },
    update: data => {
        return new Promise((resolve, reject) => {
            start(connection => {
                const sql = 'UPDATE `lessons` SET `predm` = ?, `ptype` = ?, `kab` = ?, `groups` = ? WHERE `id` = ?';
                connection.query(sql, [data.lesson.predm, data.lesson.type, data.lesson.kab, JSON.stringify(data.lesson.groups), data._id],
                    (err, results) => {
                        if (err) reject(err)
                        else resolve(results)
                        end()
                    }
                );
            })
        })
    },
    removeOne: (data, param) => {
        return new Promise((resolve, reject) => {
            start(connection => {
                const sql = 'DELETE FROM `lessons` WHERE `login` = ? AND `day` = ? AND `time` = ?';
                connection.query(sql, [data.login, data.day, data.time],
                    (err, results) => {
                        if (err) reject(err)
                        else resolve(results)
                        end()
                    }
                );
            })
        })
    },
    removeMany: (data, param) => {
        return new Promise((resolve, reject) => {
            start(connection => {
                const sql = 'DELETE FROM `lessons` WHERE `login` = ?';
                connection.query(sql, [data.login],
                    (err, results) => {
                        if (err) reject(err)
                        else resolve(results)
                        end()
                    }
                );
            })
        })
    },
    find: data => {
        return new Promise((resolve, reject) => {
            start(connection => {
                const sql = 'SELECT * FROM `lessons` WHERE `login` = ? ORDER BY `day`, `time`';
                connection.query(sql, [data.login],
                    (err, results) => {
                        if (err) reject(err)
                        else resolve(results.map(lessonMap))
                        end()
                    }
                );
            })
        })
    },
    findOne: data => {
        return new Promise((resolve, reject) => {
            start(connection => {
                const sql = 'SELECT * FROM `lessons` WHERE `login` = ? AND `day` = ? AND `time` = ? LIMIT 1';
                connection.query(sql, [data.login, data.day, data.time],
                    (err, results) => {
                        if (err) reject(err)
                        if (results.length == 0) resolve(null)
                        else resolve(results.map(lessonMap)[0])
                        end()
                    }
                );
            })
        })
    },
    // Временный маршрут. Нужен для миграции на новую БД
    count: () => {
        return new Promise((resolve, reject) => {
            start(connection => {
                const sql = 'SELECT count(*) as cnt FROM `lessons`';
                connection.query(sql,
                    (err, results) => {
                        if (err) reject(err)
                        else resolve(results[0])
                        end()
                    }
                );
            })
        })
    }
}

exports.users = {
    insert: data => {
        return new Promise((resolve, reject) => {
            start(connection => {
                const sql = 'INSERT INTO `users` (`id`, `login`, `apikey`, `date`) VALUES (NULL, ?, ?, ?);';
                connection.query(sql, [data.login, data.apikey, data.date],
                    (err, results) => {
                        if (err) reject(err)
                        else resolve(results)
                        end()
                    }
                );
            })
        })
    },
    remove: (data, param) => {
        return new Promise((resolve, reject) => {
            start(connection => {
                const sql = 'DELETE FROM `users` WHERE `login` = ? AND `apikey` = ?';
                connection.query(sql, [data.login, data.apikey],
                    (err, results) => {
                        if (err) reject(err)
                        else resolve(results)
                        end()
                    }
                );
            })
        })
    },
    find: data => {
        return new Promise((resolve, reject) => {
            start(connection => {
                const sql = 'SELECT * FROM `users` WHERE `login` = ? AND `apikey` = ? LIMIT 1';
                connection.query(sql, [data.login, data.apikey],
                    (err, results) => {
                        if (err) reject(err)
                        else resolve(results)
                        end()
                    }
                );
            })
        })
    },
}

exports.isslog = {
    insert: data => {
        return new Promise((resolve, reject) => {
            start(connection => {
                const sql = 'INSERT INTO `isslog` (`id`, `login`, `semester`, `workList`) VALUES (NULL, ?, ?, ?);';
                connection.query(sql, [data.login, data.semester, JSON.stringify(data.workList)],
                    (err, results) => {
                        if (err) {
                            reject(err)
                            console.log(JSON.stringify(err))
                        } else resolve(results)
                        end()
                    }
                );
            })
        })
    }
}

// Удалить после миграции на сервере
exports.lessonsOld = Datastore({ filename: 'db/lessons', autoload: true });
