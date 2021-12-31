import mysql from 'mysql2'

const options = {
    local: {
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'chess'
    },
    ext: {
        host: 'us-cdbr-east-05.cleardb.net',
        user: 'b3c2b38fffe3cb',
        password: '913a3d9a',
        database: 'heroku_15d24b9c875a33d'
    }
}

let con = mysql.createConnection(options.ext)

con.connect(err => {
    if (err) throw err
    console.log('> Connected to MySQL')
    createTables()
})

async function reconnect() {
    console.log("> Reconnecting to MySQL")
    return new Promise(async (resolve, reject) => {
        con = mysql.createConnection(options.ext)
        con.connect(err => {
            if (err) reject(err)
            console.log('> Connected to MySQL')
            resolve()
        })
    })
}

async function createTables() {
    //Users
    if (!(await tableExists('users'))) {
        await mysqlQuery(`CREATE TABLE users (
            id INT NOT NULL AUTO_INCREMENT,
            username VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            password VARCHAR(255) NOT NULL,
            token VARCHAR(255),
            elo INT NOT NULL DEFAULT 800,
            PRIMARY KEY (id),
            UNIQUE (username)
        )`)
        console.log('> Created table users')
    } else {
        console.log('> Table users already exists')
    }
}

function tableExists(tableName) {
    return new Promise(async (resolve, reject) => {
        try {
            const table = await mysqlQuery(`SHOW TABLES LIKE '${tableName}'`)
            resolve(table.length > 0)
        } catch (error) {
            reject(error)
        }
    })
}

export function mysqlQuery(query) {
    return new Promise((resolve, reject) => {
        con.query(query, async (err, results) => {
            if (err) {
                if (err.message.includes("Can't add new command when connection is in closed state")) {
                    await reconnect()
                    con.query(query, (err, results) => {
                        if (err) reject(err)
                        else resolve(results)
                    })
                } else {
                    reject(err)
                }
            } else {
                resolve(results)
            }
        })
    })
}

export function insertInto(table, valuesToInsert) {
    return new Promise(async (resolve, reject) => {
        const columns = []
        const iterate = valuesToInsert.length === undefined ? [valuesToInsert] : valuesToInsert
        for (const col in iterate[0]) {
            if (col === 'id') continue
            columns.push(col)
        }
        const values = []
        for (const row of iterate) {
            const value = []
            for (const col in row) {
                if (col === 'id') continue
                value.push((typeof row[col] === 'string' ? '"' : '') + row[col] + (typeof row[col] === 'string' ? '"' : ''))
            }
            values.push(value.join(', '))
        }
        let valuesStr = ''
        for (const value of values) {
            valuesStr += `(${value}), `
        }
        valuesStr = valuesStr.slice(0, -2)
        const query = `insert into ${table} (${columns.join(', ')}) values ${valuesStr}`

        try {
            const results = await mysqlQuery(query)
            resolve(results)
        } catch (error) {
            reject(error)
        }
    })
}