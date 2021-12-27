import express from 'express'
import http from 'http'
import socketio from 'socket.io'
import {
    v4 as uuidV4
} from 'uuid'

const app = express()
const server = http.createServer(app)
const sockets = socketio(server)

app.use(express.static('public'))

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

    socket.on('create-room', () => {
        const roomId = uuidV4()
        games[roomId] = Game(roomId)
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
    constructor(fromX, fromY, toX, toY) {
        this.from.x = fromX
        this.from.y = fromY
        this.to.x = toX
        this.to.y = toY
    }
}

function start() {
    players.white.emit('start')
    players.black.emit('start')

    players.white.on('move', ({
        from,
        to
    }) => {
        players.black.emit('move', new Move(from.x, from.y, to.x, to.y))
    })
    players.black.on('move', ({
        from,
        to
    }) => {
        players.white.emit('move', new Move(from.x, from.y, to.x, to.y))
    })
}

function Game(id) {
    const rematch = {
        white: false,
        black: false
    }
    const players = {
        white: null,
        black: null
    }

    function join(socket) {
        if (players.white === null) {
            players.white = socket
            socket.emit('color', 'white')
            socket.join(id)
        } else if (players.black === null) {
            players.black = socket
            socket.emit('color', 'black')
            socket.join(id)
        }
        if (players.black !== null && players.white !== null) {
            start()
        }
        console.log(`> Player joined in room ${id}`)
    }

    function leave(socket) {
        if (players.white === socket) {
            players.white = null
        } else if (players.black === socket) {
            players.black = null
        }
        sockets.to(id).emit('player-disconnected')
        console.log(`> Player disconnected from room ${id}`)
        endGame()
    }

    function start() {
        sockets.to(id).emit('start')

        players.white.on('move', ({
            from,
            to
        }) => {
            players.black.emit('move', new Move(from.x, from.y, to.x, to.y))
        })
        players.black.on('move', ({
            from,
            to
        }) => {
            players.white.emit('move', new Move(from.x, from.y, to.x, to.y))
        })


        players.white.on('request-rematch', () => {
            rematch.white = true
            checkRematch()
        })

        players.black.on('request-rematch', () => {
            rematch.black = true
            checkRematch()
        })

        players.white.on('resign', () => {
            sockets.to(id).emit('resign', 'white')
        })
        players.black.on('resign', () => {
            sockets.to(id).emit('resign', 'black')
        })
    }

    function checkRematch() {
        if (rematch.white && rematch.black) {
            rematch.white = false
            rematch.black = false
            sockets.to(id).emit('accepted-rematch')
        }
    }

    function endGame() {
        if (players.black === null && players.white === null) {
            stop()
        }
    }

    function stop() {
        console.log('stop')
        if (players.white) players.white.emit('reset')
        if (players.black) players.black.emit('reset')
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