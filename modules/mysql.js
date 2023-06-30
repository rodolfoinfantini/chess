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

    //Games
    if (!(await tableExists('games'))) {
        await mysqlQuery(`CREATE TABLE games (
            id BIGINT NOT NULL AUTO_INCREMENT,
            started DATETIME NOT NULL,
            ended DATETIME NOT NULL,
            white_player BIGINT NULL,
            black_player BIGINT NULL,
            winner BIGINT NULL,
            winner_color VARCHAR(5) NOT NULL,
            final_position VARCHAR(100) NOT NULL,
            PRIMARY KEY (id),
            CONSTRAINT fk_white_player FOREIGN KEY (white_player) REFERENCES users(id),
            CONSTRAINT fk_black_player FOREIGN KEY (black_player) REFERENCES users(id),
            CONSTRAINT fk_winner FOREIGN KEY (winner) REFERENCES users(id)
        )`)
        console.log('> Created table games')
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

export function mysqlQuery(...query) {
    return new Promise((resolve, reject) => {
        con.query(...query, async (err, results) => {
            if (err) {
                if (
                    err.message.includes("Can't add new command when connection is in closed state")
                ) {
                    await reconnect()
                    con.query(...query, (err, results) => {
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

export async function insertInto(table, valuesToInsert) {
    if (typeof valuesToInsert !== 'object') throw new Error('valuesToInsert must be an object')
    if (Array.isArray(valuesToInsert) && valuesToInsert.length === 0) return
    if (Object.keys(valuesToInsert).length === 0) return

    const columns = []
    const valuesArray = Array.isArray(valuesToInsert) ? valuesToInsert : [valuesToInsert]
    for (const col in valuesArray[0]) if (col !== 'id') columns.push(col)

    const values = []
    for (const row of valuesArray) {
        const value = []
        for (const col in row) {
            if (col === 'id') continue
            value.push(row[col])
        }
        values.push(value)
    }
    let valuesStr = ''
    for (const value of values) {
        valuesStr += `(${new Array(value.length).fill('?').join(',')}), `
    }
    valuesStr = valuesStr.slice(0, -2)
    const query = `insert into ${table} (${columns.join(', ')}) values ${valuesStr}`

    const results = await mysqlQuery(query, values.flat())
    return results
}
