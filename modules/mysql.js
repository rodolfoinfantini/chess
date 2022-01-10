import mysql from 'mysql2'
import dotenv from 'dotenv'
dotenv.config()

const options = {
    ext: {
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB,
    },
}

let con = mysql.createConnection(options.ext)

con.connect((err) => {
    if (err) throw err
    console.log('> MySQL: connected')
    createTables()
})

async function reconnect() {
    console.log('> MySQL: reconnecting')
    return new Promise(async (resolve, reject) => {
        con = mysql.createConnection(options.ext)
        con.connect((err) => {
            if (err) reject(err)
            console.log('> MySQL: connected')
            resolve()
        })
    })
}

async function createTables() {
    //Users
    if (!(await tableExists('users'))) {
        await mysqlQuery(`CREATE TABLE users (
            id BIGINT NOT NULL AUTO_INCREMENT,
            username VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            password VARCHAR(255) NOT NULL,
            token VARCHAR(255),
            elo INT NOT NULL DEFAULT 800,
            matches BIGINT NOT NULL DEFAULT 0,
            wins BIGINT NOT NULL DEFAULT 0,
            verified BOOLEAN NOT NULL DEFAULT FALSE,
            PRIMARY KEY (id),
            UNIQUE (username),
            UNIQUE (email)
        )`)
        console.log('> Created table users')
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
                if (
                    err.message.includes("Can't add new command when connection is in closed state")
                ) {
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
                value.push(
                    (typeof row[col] === 'string' ? '"' : '') +
                        row[col] +
                        (typeof row[col] === 'string' ? '"' : '')
                )
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
