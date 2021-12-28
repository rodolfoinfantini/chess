import express from 'express'
import http from 'http'
import socketio from 'socket.io'
import {
    v4 as uuidV4
} from 'uuid'
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

const app = express()
const server = http.createServer(app)
const sockets = socketio(server)

app.use(express.static('public'))

app.get('/puzzle/random', (req, res) => {
    res.json(randomPuzzle(req.query.minRating, req.query.maxRating, req.query.themes))
})


const games = {}

function oppositeColor(color) {
    return color === 'white' ? 'black' : 'white'
}

sockets.on('connection', (socket) => {
    console.log(`> Client connected ${socket.id}`)

    socket.on('join-room', (roomId) => {
        if (games[roomId]) {
            socket.emit('join-room', 'success')
            console.log(`> Client joined room ${roomId}`)
            games[roomId].join(socket)

            socket.on('disconnect', () => {
                games[roomId].leave(socket)
            })
        } else {
            socket.emit('not-found')
        }
    })

    socket.on('create-room', (time) => {
        if (isNaN(time)) {
            socket.emit('create-room', 'error:Time must be a number')
            return
        }
        time = +time
        if (time < 10) {
            socket.emit('create-room', 'error:Time must be greater than 10 seconds')
            return
        }
        if (time > 3600) {
            socket.emit('create-room', 'error:Time limit is 1 hour')
            return
        }

        let newId = randStr(10)
        while (games[newId]) {
            newId = randStr(10)
        }
        const roomId = newId
        games[roomId] = Game(roomId, +time)
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

function Game(id, time) {
    const gameTime = time

    const players = {
        white: {
            socket: null,
            timer: new Timer(secToMs(gameTime))
        },
        black: {
            socket: null,
            timer: new Timer(secToMs(gameTime))
        }
    }

    setInterval(() => {
        if (msToSec(players.white.timer.getTime()) <= 0) {
            sockets.to(id).emit('time-out', 'white')
        } else if (msToSec(players.black.timer.getTime()) <= 0) {
            sockets.to(id).emit('time-out', 'black')
        }
    }, 100)

    let turn = 'w'
    const moves = []

    const engine = stockfish()

    engine.onmessage = (data) => {
        data = data + ''
        if (data.startsWith('Fen:')) {
            const curTurn = data.split(' ')[2]
            if (curTurn === turn) {
                validMove()
            } else {
                invalidMove()
            }
        }
    }

    engine.postMessage('ucinewgame')
    engine.postMessage('position startpos')

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
        players[turn === 'b' ? 'black' : 'white'].socket.emit('move', new Move(from.x, from.y, to.x, to.y))
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

    function join(socket) {
        if (players.white.socket === null) {
            players.white.socket = socket
            players.white.timer = new Timer(secToMs(gameTime))
            socket.emit('color', 'white')
            socket.join(id)
        } else if (players.black.socket === null) {
            players.black.socket = socket
            players.black.timer = new Timer(secToMs(gameTime))
            socket.emit('color', 'black')
            socket.join(id)
        }
        if (players.black.socket !== null && players.white.socket !== null) {
            start()
        }
        console.log(`> Player joined in room ${id}`)
    }

    function leave(socket) {
        if (players.white.socket === socket) {
            players.white.socket = null
        } else if (players.black.socket === socket) {
            players.black.socket = null
        }
        sockets.to(id).emit('player-disconnected')
        console.log(`> Player disconnected from room ${id}`)
        endGame()
    }

    function start() {
        sockets.to(id).emit('start', gameTime)

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
            sockets.to(id).emit('resign', 'white')
        })
        players.black.socket.on('resign', () => {
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
        stop
    }
}

const port = process.env.PORT || 3000

server.listen(port, () => {
    console.log(`> Server listening on port ${port}`)
    console.log(`> http://localhost:${port}`)
})