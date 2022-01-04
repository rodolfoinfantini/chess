import express from 'express'
import http from 'http'
import socketio from 'socket.io'
import stockfish from 'stockfish'

import {
    moveString,
    moveNumber
} from './public/modules/constants.js'

import randStr from './modules/randomString.js'

import Timer, {
    msToSec
} from './public/modules/timer.js'

import {
    randomPuzzle
} from './modules/puzzle.js'

import {
    mysqlQuery,
    insertInto
} from './modules/mysql.js'

import {
    encrypt
} from './modules/encript.js'

const app = express()
const server = http.createServer(app)
const sockets = socketio(server)

app.use(express.static('public'))
app.use(express.json())

async function getEloFromToken(token) {
    if (!token) {
        return {
            elo: null,
            username: null
        }
    }
    const user = await mysqlQuery(`select * from users where token = '${token}'`)
    if (user.length === 0) {
        return {
            elo: null,
            username: null
        }
    }
    return {
        elo: user[0].elo,
        username: user[0].username
    }
}

async function login(username, password) {
    return new Promise(async (resolve, reject) => {
        try {
            const encryptedPassword = encrypt(password)
            const user = await mysqlQuery(`select * from users where username = '${username}' and password = '${encryptedPassword}'`)
            if (user.length === 0) {
                reject(new Error('Invalid username or password'))
            }
            let newToken = randStr(40)
            const token = await mysqlQuery(`select token from users where token = '${newToken}'`)
            if (token.length > 0) {
                while (newToken === token[0].token) {
                    newToken = randStr(10)
                }
            }
            await mysqlQuery(`update users set token = '${newToken}' where username = '${username}' and password = '${encryptedPassword}'`)
            resolve(newToken)
        } catch (error) {
            reject(error)
        }
    })
}

async function insertToUsers(values) {
    try {
        await insertInto('users', values)
    } catch (e) {
        if (e.message.includes('Duplicate entry')) {
            if (e.message.includes('username')) throw new Error('Username already registered')
            else if (e.message.includes('email')) throw new Error('Email already registered')
        } else {
            throw e
        }
    }
}


let log = false

app.get('/ping', (req, res) => {
    // res.send(new Date().getTime() + '')
    res.send('pong')
})

app.post('/account/login', (req, res) => {
    let {
        username,
        password
    } = req.body

    username = username.trim()
    password = password.trim()

    if (username.length === 0) {
        res.json({
            success: false,
            error: 'Username cannot be empty'
        })
        return
    }
    if (password.length === 0) {
        res.json({
            success: false,
            error: 'Password cannot be empty'
        })
        return
    }

    login(username, password)
        .then(token => {
            if (token) {
                res.json({
                    success: true,
                    token,
                    username
                })
            } else {
                res.json({
                    success: false
                })
            }
        }).catch(e => {
            res.json({
                success: false,
                error: e.message
            })
        })
})

function validadeUsername(username) {
    const reg = /[a-zA-Z0-9]+/
    return reg.test(username) && username.length >= 4 && username.length <= 20
}

function validadePassword(password) {
    return password.length >= 6 && password.length <= 30
}

function validadeEmail(email) {
    const reg = /\S+@\S+\.\S+/
    return reg.test(email)
}

function error(message) {
    return {
        success: false,
        error: message
    }
}

app.post('/account/register', (req, res) => {
    let {
        username,
        password,
        confirmPassword,
        email
    } = req.body

    username = username.trim()
    password = password.trim()
    confirmPassword = confirmPassword.trim()
    email = email.trim()

    //empty
    if (username.length === 0) {
        res.json(error("Username cannot be empty"))
        return
    }
    if (password.length === 0) {
        res.json(error("Password cannot be empty"))
        return
    }
    if (email.length === 0) {
        res.json(error("Email cannot be empty"))
        return
    }

    //validation
    if (!validadeUsername(username)) {
        res.json(error("Username must have only letter and numbers and be between 4 and 20 characters"))
        return
    }
    if (!validadePassword(password)) {
        res.json(error("Password must be between 6 and 30 characters"))
        return
    }
    if (!validadeEmail(email)) {
        res.json(error("Email is not valid"))
        return
    }

    //password match
    if (password !== confirmPassword) {
        res.json(error("Passwords don't match"))
        return
    }

    password = encrypt(password)

    insertToUsers({
        username,
        password,
        email
    }).then(() => {
        res.json({
            success: true
        })
    }).catch(e => {
        res.json({
            success: false,
            error: e.message
        })
    })
})

app.get('/puzzle/random', (req, res) => {
    res.json(randomPuzzle(req.query.minRating, req.query.maxRating, req.query.themes))
})

app.get('/log', (req, res) => {
    log = !log
    res.json({
        log: log
    })
})


const games = {}

function oppositeColor(color) {
    return color === 'white' ? 'black' : 'white'
}

sockets.on('connection', (socket) => {
    console.log(`> Client connected ${socket.id}`)

    socket.on('join-room', ({
        roomId,
        token,
        color
    }) => {
        if (games[roomId]) {
            socket.emit('join-room', 'success')
            console.log(`> Client joined room ${roomId}`)
            games[roomId].join(socket, token, color)

            socket.on('disconnect', () => {
                if (games[roomId]) games[roomId].leave(socket)
            })
        } else {
            socket.emit('not-found')
        }
    })

    socket.on('get-rooms', () => {
        const rooms = []
        for (const roomId in games) {
            if (!games[roomId].isPublic) continue
            rooms.push({
                roomId,
                player: games[roomId].getOwnerInfo(),
                time: games[roomId].getTime()
            })
        }
        socket.emit('get-rooms', rooms)
    })

    socket.on('create-room', ({
        time,
        rated,
        isPublic
    }) => {
        if (isNaN(time)) {
            socket.emit('create-room', 'error:Time must be a number')
            return
        }
        time = +time
        if (time < 10) {
            socket.emit('create-room', 'error:Time must be greater than 10 seconds')
            return
        }
        if (time > 10800) {
            socket.emit('create-room', 'error:Time limit is 180 minutes')
            return
        }

        let newId = randStr(10)
        while (games[newId]) {
            newId = randStr(10)
        }
        const roomId = newId
        games[roomId] = Game(roomId, +time, !!rated, !!isPublic)
        console.log(`> Room created ${roomId}`)
        socket.emit('create-room', roomId)
    })
})

class Move {
    from = {
        x: null,
        y: null
    }
    to = {
        x: null,
        y: null
    }
    promotion
    constructor(fromX, fromY, toX, toY, promotion = null) {
        this.from.x = fromX
        this.from.y = fromY
        this.to.x = toX
        this.to.y = toY
        this.promotion = promotion
    }
}

function secToMs(sec) {
    return sec * 1000
}

function Game(id, time, rated = false, isPublic = false) {
    let state = 0

    const roomOwner = {
        username: null,
        elo: null
    }

    function getOwnerInfo() {
        return roomOwner
    }

    const gameTime = time

    function getTime() {
        return gameTime
    }

    let fen = `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`

    const players = {
        white: {
            socket: null,
            timer: new Timer(secToMs(gameTime)),
            token: null,
            info: null
        },
        black: {
            socket: null,
            timer: new Timer(secToMs(gameTime)),
            token: null,
            info: null
        }
    }

    setInterval(() => {
        if (msToSec(players.white.timer.getTime()) <= 0) {
            win('black')
            sockets.to(id).emit('time-out', 'white')
        } else if (msToSec(players.black.timer.getTime()) <= 0) {
            win('white')
            sockets.to(id).emit('time-out', 'black')
        }
    }, 100)

    let turn = 'w'
    const moves = []

    const engine = stockfish()

    engine.onmessage = (data) => {
        data = data + ''
        if (data.startsWith('Fen:')) {
            fen = data.split(':')[1].trim()
            const curTurn = data.split(' ')[2]
            if (curTurn === turn) {
                validMove()
            } else {
                invalidMove()
            }
        }
        if (data == 'info depth 0 score mate 0') {
            console.log(`> Room ${id}: Checkmate! ${turn === 'b' ? 'White' : 'Black'} is victorious`)
            win(turn === 'b' ? 'white' : 'black')
        }
    }

    engine.postMessage('ucinewgame')
    engine.postMessage('position startpos')

    function win(color) {
        if (players[color].token && rated) {
            mysqlQuery(`update users set elo = elo + 10 where token = '${players[color].token}'`)
            players[color].socket.emit('update-elo', 10)
        } else if (players[oppositeColor(color)].token && rated) {
            mysqlQuery(`update users set elo = elo - 10 where token = '${players[oppositeColor(color)].token}'`)
            players[oppositeColor(color)].socket.emit('update-elo', -10)
        }
    }

    function notYourTurn(color) {
        if (players[color].socket) players[color].socket.emit('not-your-turn')
    }

    function invalidMove() {
        players[turn === 'w' ? 'black' : 'white'].socket.emit('invalid-move')
        turn = turn === 'w' ? 'b' : 'w'
        moves.splice(moves.length - 1, 1)
    }

    function validMove() {
        const lastMove = moves[moves.length - 1]
        const lastMoveArr = lastMove.split('')
        const from = {
            x: +moveNumber[`x${lastMoveArr[0]}`],
            y: +moveNumber[`y${lastMoveArr[1]}`]
        }
        const to = {
            x: +moveNumber[`x${lastMoveArr[2]}`],
            y: +moveNumber[`y${lastMoveArr[3]}`]
        }
        if (turn === 'b') {
            players.white.timer.stop()
            players.black.timer.start()
        } else {
            players.black.timer.stop()
            players.white.timer.start()
        }
        engine.postMessage(`go depth 1`)
        players[turn === 'b' ? 'black' : 'white'].socket.emit('move', new Move(from.x, from.y, to.x, to.y))
        sockets.to(id + '-spectator').emit('move', new Move(from.x, from.y, to.x, to.y))
        sockets.to(id).emit('update-timers', {
            white: players.white.timer.getTime(),
            black: players.black.timer.getTime(),
            running: turn === 'b' ? 'black' : 'white'
        })
    }

    function verifyMove(from, to, promotion = '') {
        const fromStr = moveString[`x${from.x}`] + '' + moveString[`y${from.y}`]
        const toStr = moveString[`x${to.x}`] + '' + moveString[`y${to.y}`]

        moves.push(fromStr + toStr + promotion)

        engine.postMessage('position startpos moves ' + moves.join(' '))
        engine.postMessage('d')
    }

    const rematch = {
        white: false,
        black: false
    }

    async function join(socket, token, color) {
        if (state === 3) {
            socket.emit('join-room', 'error:Game already finished')
            return
        }
        if (token && (players.white.token === token || players.black.token === token)) {
            socket.emit('join-room', 'error:You are already in this room')
            return
        }
        let joined = false
        if (state === 0) {
            if (!color) {
                if (players.white.socket === null) {
                    joined = true
                    players.white.socket = socket
                    players.white.timer = new Timer(secToMs(gameTime))
                    players.white.token = token
                    socket.emit('color', 'white')
                    socket.join(id)
                } else if (players.black.socket === null) {
                    joined = true
                    players.black.socket = socket
                    players.black.timer = new Timer(secToMs(gameTime))
                    players.black.token = token
                    socket.emit('color', 'black')
                    socket.join(id)
                }
            } else {
                if (players[color].socket === null) {
                    joined = true
                    players[color].socket = socket
                    players[color].timer = new Timer(secToMs(gameTime))
                    players[color].token = token
                    socket.emit('color', color)
                    socket.join(id)
                    if (roomOwner.username === null) {
                        const info = await getEloFromToken(token)
                        roomOwner.username = info.username || 'Anonymous'
                        roomOwner.elo = info.elo || '800?'
                    }
                } else if (players[oppositeColor(color)].socket === null) {
                    joined = true
                    players[oppositeColor(color)].socket = socket
                    players[oppositeColor(color)].timer = new Timer(secToMs(gameTime))
                    players[oppositeColor(color)].token = token
                    socket.emit('color', oppositeColor(color))
                    socket.join(id)
                    if (roomOwner.username === null) {
                        const info = await getEloFromToken(token)
                        roomOwner.username = info.username || 'Anonymous'
                        roomOwner.elo = info.elo || '800?'
                    }
                }
            }
        }
        if (!joined) {
            socket.join(id)
            socket.join(id + '-spectator')
            socket.emit('spectator', {
                fen: fen,
                gameTime: gameTime,
                players: {
                    white: players.white.info,
                    black: players.black.info
                }
            })
            let running = null
            if (players.white.timer.isRunning) {
                running = 'white'
            } else if (players.black.timer.isRunning) {
                running = 'black'
            }
            console.log('white', players.white.timer.getTime())
            console.log('black', players.black.timer.getTime())
            sockets.to(id + '-spectator').emit('update-timers', {
                white: players.white.timer.getTime(),
                black: players.black.timer.getTime(),
                running: running
            })
        } else {
            if (players.black.socket !== null && players.white.socket !== null) {
                start()
            }
        }
        console.log(`> Player joined in room ${id}`)
    }

    function leave(socket) {
        if (state === 0 || state === 2) {
            players.white.socket = null
            players.black.socket = null
            stop()
            return
        }
        if (players.white.socket === socket) {
            if (state === 1) {
                state = 2
                players.white.socket = null
                players.white.token = null
                sockets.to(id).emit('player-disconnected', 'white')
            }
        } else if (players.black.socket === socket) {
            if (state === 1) {
                state = 2
                players.black.socket = null
                players.black.token = null
                sockets.to(id).emit('player-disconnected', 'black')
            }
        }
        console.log(`> Player left room ${id}`)
        endGame()
    }

    async function start() {
        state = 1

        players.white.info = await getEloFromToken(players.white.token)
        players.black.info = await getEloFromToken(players.black.token)

        sockets.to(id).emit('start', {
            gameTime,
            players: {
                white: players.white.info,
                black: players.black.info
            }
        })

        players.white.socket.on('move', ({
            from,
            to,
            promotion
        }) => {
            if (turn === 'b') {
                notYourTurn('white')
                return
            }
            turn = 'b'
            verifyMove(from, to, promotion ? 'q' : '')
        })
        players.black.socket.on('move', ({
            from,
            to,
            promotion
        }) => {
            if (turn === 'w') {
                notYourTurn('black')
                return
            }
            turn = 'w'
            verifyMove(from, to, promotion ? 'q' : '')
        })


        players.white.socket.on('request-rematch', () => {
            rematch.white = true
            checkRematch()
        })

        players.black.socket.on('request-rematch', () => {
            rematch.black = true
            checkRematch()
        })

        players.white.socket.on('resign', () => {
            win('black')
            sockets.to(id).emit('resign', 'white')
        })
        players.black.socket.on('resign', () => {
            win('white')
            sockets.to(id).emit('resign', 'black')
        })
    }

    function checkRematch() {
        if (rematch.white && rematch.black) {
            turn = 'w'
            moves.length = 0
            engine.postMessage('ucinewgame')
            engine.postMessage('position startpos')

            rematch.white = false
            rematch.black = false

            players.white.timer.stop()
            players.black.timer.stop()

            players.white.timer.reset()
            players.black.timer.reset()

            sockets.to(id).emit('update-timers', {
                white: secToMs(gameTime),
                black: secToMs(gameTime),
                running: null
            })

            sockets.to(id).emit('accepted-rematch')
        }
    }

    function endGame() {
        if (players.black.socket === null && players.white.socket === null) {
            stop()
        }
    }

    function stop() {
        console.log(`> Room ${id} closed`)
        if (players.white.socket) players.white.socket.emit('reset')
        if (players.black.socket) players.black.socket.emit('reset')
        delete games[id]
    }

    return {
        join,
        leave,
        stop,
        isPublic,
        getOwnerInfo,
        getTime
    }
}

const port = process.env.PORT || 3000

server.listen(port, () => {
    console.log(`> Server listening on port ${port}`)
    console.log(`> http://localhost:${port}`)
})