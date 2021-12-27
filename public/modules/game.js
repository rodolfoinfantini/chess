import Piece, {
    oppositeColor,
    posString
} from './piece.js'

import Tile from './tile.js'

import {
    startPosition
} from './startPosition.js'

import {
    tile,
    letter,
    moveString,
    moveNumber,
    gamemode,
    color,
    colorLetter,
    type,
    state as states,
    info
} from './constants.js'

import {
    play
} from './sound.js'

import Timer, {
    secToMs,
    msToSec,
    timeString
} from './timer.js'

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

export function Game(gMode, playerColor, board, socket, time) {
    time = +time


    const toMoveDiv = board.querySelector('.color-to-move')
    const autoFlipCheckBox = board.querySelector('.board-options .auto-flip input')

    let turn = color.white

    function setTurn(newTurn) {
        if (toMoveDiv) toMoveDiv.classList.replace(turn, newTurn)

        turn = newTurn

        if (toMoveDiv) toMoveDiv.textContent = `${turn === color.white ? 'White' : 'Black'} to move`

        //auto flip
        if (mode === gamemode.playerVsPlayer && autoFlipCheckBox.checked) {
            if (turn === color.white) {
                board.classList.remove('flipped')
            } else {
                board.classList.add('flipped')
            }
        }
    }

    function getTurn() {
        return turn
    }

    const position = {
        fen: '',
        movesHistory: 'position startpos moves',
        fenHistory: [],
        fullMoves: 0,
        halfMoves: 0
    }

    const pieces = []

    const tiles = {
        selected: [],
        lastMove: [],
        move: [],
        check: []
    }
    const castling = {
        Q: true, //white
        K: true, //white
        q: true, //black
        k: true //black
    }
    const enPassant = {
        x: null,
        y: null
    }


    let mode = gMode

    function setGameMode(newMode) {
        mode = newMode
    }
    const player = {
        color: playerColor
    }
    let state = states.start
    let moveTime = 200

    function setMoveTime(newMoveTime) {
        moveTime = newMoveTime
    }
    const stockfish = new Worker('./stockfish/stockfish.js')

    let isClicking = false

    let draggingPiece

    let ghostPiece

    const attacked = {
        [color.white]: {},
        [color.black]: {}
    }

    if (mode === gamemode.multiplayer) {
        const timers = {
            white: new Timer(secToMs(time)),
            black: new Timer(secToMs(time))
        }

        const elements = {
            white: document.createElement('div'),
            black: document.createElement('div')
        }
        elements.white.classList.add('timer')
        elements.white.classList.add('timer-white')
        elements.black.classList.add('timer')
        elements.black.classList.add('timer-black')

        board.appendChild(elements.white)
        board.appendChild(elements.black)

        setInterval(() => {
            const secs = {
                white: Math.max(0, msToSec(timers.white.getTime())),
                black: Math.max(0, msToSec(timers.black.getTime()))
            }
            const strings = {
                white: timeString(secs.white),
                black: timeString(secs.black)
            }

            elements.white.textContent = strings.white
            elements.black.textContent = strings.black
        }, 100)

        socket.on('update-timers', data => {
            if (data.running === 'white') {
                timers.black.stop()
                timers.white.start()
            } else if (data.running === 'black') {
                timers.white.stop()
                timers.black.start()
            } else {
                timers.white.stop()
                timers.black.stop()
            }
            timers.black.setTime(+data.black)
            timers.white.setTime(+data.white)
        })
    }


    function startPos() {
        state = states.start

        isClicking = false
        draggingPiece = null
        ghostPiece = null

        stockfish.postMessage("ucinewgame")
        if (pieces.length > 0) {
            pieces.forEach(piece => piece.element.remove())
        }
        pieces.length = 0
        startPosition.forEach(piece => {
            const newPiece = new Piece(piece.type, piece.color, piece.x, piece.y, board, false, obj)
            newPiece.render()
            pieces.push(newPiece)
        })
        turn = color.white
        position.fen = fenString()
        position.movesHistory = `position fen ${position.fen} moves`
        stockfish.postMessage(`position fen ${position.fen}`)
        // position.movesHistory = `position startpos moves`
        position.fenHistory.length = 0
        position.fenHistory.push(position.fen)
        position.fullMoves = 0
        position.halfMoves = 0
        clearTiles('check')
        clearTiles('selected')
        clearTiles('move')
        clearTiles('lastMove')
        enPassant.x = null
        enPassant.y = null
        castling.q = true
        castling.k = true
        castling.Q = true
        castling.K = true
    }

    function stop() {
        stockfish.onmessage = null
        pieces.forEach(piece => piece.element.remove())
        state = states.end
        board.onmousedown = null
        board.onmouseleave = null
        board.onmouseup = null
        board.onmousemove = null
    }

    function start() {
        try {
            board.querySelector('.playing-as').textContent = `Playing as ${player.color === color.white ? 'White' : 'Black'}`
            board.querySelector('.playing-as').classList.add(player.color)
        } catch (e) {}

        if (toMoveDiv) toMoveDiv.textContent = 'White to move'
        if (toMoveDiv) toMoveDiv.classList.add(turn)

        play.start()

        state = states.playing

        if (mode === gamemode.computerVsComputer) moveStockfish()
        if (mode === gamemode.playerVsComputer && player.color === color.black) moveStockfish()
    }

    function restart() {
        startPos()
        start()
    }

    function getClientRect() {
        return board.getBoundingClientRect()
    }

    board.onmousedown = ({
        target,
        clientX,
        clientY
    }) => {
        clearTiles('selected')
        clearTiles('move')

        if (state !== states.playing) return

        if (target.tagName.toLowerCase() != 'piece') {
            if (target.classList.contains('tile')) {
                move(clientX, clientY)
            }
            return
        }
        const clickedPiece = findPiece(target)
        if (mode === gamemode.playerVsPlayer) {
            if (clickedPiece.color !== turn) {
                return
            }
        } else if (mode === gamemode.computerVsComputer) {
            return
        } else if (mode === gamemode.playerVsComputer || mode === gamemode.multiplayer) {
            if (clickedPiece.color !== player.color || clickedPiece.color !== turn) {
                return
            }
        }
        isClicking = true
        const boardRect = getClientRect()
        const pos = {
            x: clientX - boardRect.left,
            y: clientY - boardRect.top
        }
        draggingPiece = clickedPiece
        draggingPiece.moveElement(pos.x, pos.y)
        draggingPiece.createLegalMoves()

        ghostPiece = new Piece(draggingPiece.type, draggingPiece.color, draggingPiece.x, draggingPiece.y, board, true, obj)
        ghostPiece.render()

        const newTile = new Tile(draggingPiece.x, draggingPiece.y, board, tile.selected)
        tiles.selected.push(newTile)

        for (const key in draggingPiece.legalMoves) {
            const posArray = key.replace('x', '').split('y')
            const x = posArray[0]
            const y = posArray[1]
            tiles.move.push(new Tile(x, y, board, draggingPiece.legalMoves[key] ? tile.capture : tile.move))
        }
    }
    board.onmouseleave = () => {
        resetAllPieces()
        isClicking = false
        if (ghostPiece) {
            ghostPiece.element.remove()
            ghostPiece = null
        }
    }

    //!MOVE
    board.onmouseup = ({
        clientX,
        clientY
    }) => {
        if (state !== states.playing) return
        if (!isClicking) return
        isClicking = false
        move(clientX, clientY)
    }

    function movePiece(from, to) {
        const piece = pieces.find(piece => piece.x === from.x && piece.y === from.y)
        if (piece) {
            const moveResult = piece.move(to.x, to.y, true)
            if (moveResult) {
                hasMoved(piece)
                updatePosition(`${from.x}${from.y}`, `${to.x}${to.y}`, moveResult === 'q' ? 'q' : undefined)
            }
        }
        analyzeStockfish()
    }

    function move(clientX, clientY) {
        if (!draggingPiece) return
        const boardRect = getClientRect()
        const pos = {
            x: clientX - boardRect.left,
            y: clientY - boardRect.top
        }
        if (board.classList.contains('flipped')) {
            pos.x = board.offsetWidth - pos.x
            pos.y = board.offsetHeight - pos.y
        }
        const x = Math.floor(8 * (pos.x / board.offsetWidth))
        const y = Math.floor(8 * (pos.y / board.offsetHeight))

        if (draggingPiece.x === x && draggingPiece.y === y) {
            draggingPiece.resetPosition()
            removeGhostPiece()
            return
        }

        const from = `${draggingPiece.x}${draggingPiece.y}`
        const to = `${x}${y}`

        removeGhostPiece()

        if (draggingPiece) {
            const moveResult = draggingPiece.move(x, y)
            if (moveResult) {
                if (mode === gamemode.multiplayer && socket) {
                    socket.emit('move', new Move(+from.split('')[0], +from.split('')[1], x, y, moveResult === 'q' ? 'q' : undefined))
                }
                if (hasMoved(draggingPiece)) {
                    updatePosition(from, to, moveResult === 'q' ? 'q' : undefined)
                    draggingPiece = null
                    return
                }
                updatePosition(from, to, moveResult === 'q' ? 'q' : undefined)
                draggingPiece = null
            }
        }

        stockfish.postMessage(position.movesHistory)

        if (mode === gamemode.playerVsComputer) moveStockfish()
        else analyzeStockfish()
    }



    //!HAS MOVED
    function hasMoved(piece) {
        if (piece.type === type.pawn) {
            position.halfMoves = 0
        }
        if (turn === color.white) {
            position.fullMoves++
        }
        const isDraw = checkDraw()
        if (isDraw !== false) {
            draw(isDraw)
            return true
        }
        return false
    }

    function checkDraw() {
        if (repetitionDraw()) return info.repetition
        if (fiftyMovesDraw()) return info.fiftyMoves

        return false
    }

    function fiftyMovesDraw() {
        return position.halfMoves >= 100
    }

    function repetitionDraw() {
        const fenHistory = position.fenHistory.filter((item, index) => position.fenHistory.indexOf(item) === index)
        const fenHistoryCount = fenHistory.map(item => position.fenHistory.filter(i => i === item).length)
        const repetition = fenHistoryCount.filter(item => item > 2)
        return repetition.length > 0
    }

    function draw(str) {
        showInfo(info[str] || info.draw)
    }

    function removeGhostPiece() {
        if (ghostPiece) {
            ghostPiece.element.remove()
            ghostPiece = null
        }
    }

    function clearTiles(key) {
        if (!tiles[key]) return
        tiles[key].forEach(tile => tile.element.remove())
        tiles[key].length = 0
    }

    function findPiece(element) {
        return pieces.find(piece => {
            return piece.element === element
        })
    }

    function resetAllPieces() {
        pieces.forEach(piece => piece.resetPosition())
    }

    board.onmousemove = (e) => {
        if (!isClicking || !draggingPiece) return
        const boardRect = getClientRect()
        const pos = {
            x: e.clientX - boardRect.left,
            y: e.clientY - boardRect.top
        }
        draggingPiece.moveElement(pos.x, pos.y)
    }

    //!FEN
    function fenString() {
        let fen = ''

        //position
        for (let y = 0; y < 8; y++) {
            let empty = 0
            for (let x = 0; x < 8; x++) {
                const piece = pieces.find(piece => piece.x === x && piece.y === y)
                if (piece) {
                    if (empty > 0) {
                        fen += empty
                        empty = 0
                    }
                    fen += letter[piece.type][piece.color]
                } else {
                    empty++
                }
            }
            if (empty > 0) {
                fen += empty
            }
            if (y < 7) {
                fen += '/'
            }
        }

        //color to move
        fen += ' ' + colorLetter[turn]

        //castling rights
        if (castling.Q === false && castling.q === false && castling.K === false && castling.k === false) {
            fen += ' -'
        } else {
            fen += ' '
            if (castling.K) {
                fen += 'K'
            }
            if (castling.Q) {
                fen += 'Q'
            }
            if (castling.k) {
                fen += 'k'
            }
            if (castling.q) {
                fen += 'q'
            }
        }

        //en passant targets
        if (enPassant.x && enPassant.y) {
            const x = enPassant.x + ''
            const y = enPassant.y + ''
            fen += ' ' + moveNumberToString(x + y)
        } else {
            fen += ' -'
        }

        //halfMoves and fullMoves
        fen += ' ' + position.halfMoves + ' ' + position.fullMoves

        // console.log('fen:', fen)

        return fen
    }

    function moveStringToNumber(str) {
        const split = str.split('')
        if (split.length === 4) {
            return moveNumber['x' + split[0]] + moveNumber['y' + split[1]] + moveNumber['x' + split[2]] + moveNumber['y' + split[3]]
        }
        if (split.length === 2) {
            return moveNumber['x' + split[0]] + moveNumber['y' + split[1]]
        }
        if (split.length === 5) {
            return moveNumber['x' + split[0]] + moveNumber['y' + split[1]] + moveNumber['x' + split[2]] + moveNumber['y' + split[3]] + split[4]
        }
    }

    function moveNumberToString(num) {
        const split = num.split('')
        if (split.length === 4) {
            return moveString['x' + split[0]] + moveString['y' + split[1]] + moveString['x' + split[2]] + moveString['y' + split[3]]
        }
        if (split.length === 2) {
            return moveString['x' + split[0]] + moveString['y' + split[1]]
        }
    }

    function updatePosition(from, to, promotion = '') {
        from = from + ''
        to = to + ''
        promotion = promotion + ''
        position.movesHistory += ' ' + moveNumberToString(from + to) + promotion
        position.fen = fenString()
        position.fenHistory.push(position.fen.split(' ')[0])
        stockfish.postMessage(position.movesHistory)
    }

    stockfish.onmessage = ({
        data
    }) => {
        if (state === states.end || state === states.start) return
        const dataArr = data.split(' ')
        if (data.includes('checkmate') || data === 'info depth 0 score mate 0') {
            checkmate(oppositeColor(turn))
            return
        } else if (dataArr.includes('bestmove')) {
            if (!data.includes('(none)')) {
                if ((mode === gamemode.playerVsComputer && turn !== player.color) || mode === gamemode.computerVsComputer && mode !== gamemode.multiplayer) {
                    const move = dataArr[1]
                    const moveNumber = moveStringToNumber(move)
                    const split = moveNumber.split('')
                    const piece = pieces.find(piece => piece.x == split[0] && piece.y == split[1])
                    if (!piece) return
                    piece.move(split[2], split[3], true)
                    if (hasMoved(piece)) {
                        updatePosition(split[0] + split[1], split[2] + split[3], split[4])
                        return
                    }
                    updatePosition(split[0] + split[1], split[2] + split[3], split[4])
                    if (mode === gamemode.computerVsComputer) moveStockfish()
                    else analyzeStockfish()
                }
            } else {
                if (state === states.playing) stalemate()
            }
        }
    }

    function stalemate() {
        play.end()
        state = states.end
        draw(info.stalemate)
    }

    function checkmate(winner) {
        play.end()
        state = states.end
        showInfo(info.checkmate, winner)
    }

    function resign(color) {
        play.end()
        state = states.end
        showInfo(info.resign, color)
    }

    if (socket) socket.on('time-out', timeOut)

    function timeOut(lostColor) {
        if (state === states.playing) {
            play.end()
            state = states.end
            showInfo(info.timeOut, lostColor === 'black' ? color.white : color.black)
        }
    }

    function showInfo(infoType, winner) {
        const div = document.createElement('div')
        div.classList.add('info')
        div.classList.add(infoType)
        if (winner) div.classList.add(winner === color.white ? 'white' : 'black')
        const h1 = document.createElement('h1')
        const p = document.createElement('p')
        if (infoType === info.checkmate) {
            h1.textContent = 'Checkmate!'
            p.textContent = `${winner === color.white ? 'White' : 'Black'} is victorious.`
        } else if (infoType === info.repetition) {
            h1.textContent = 'Draw!'
            p.textContent = 'By repetition.'
        } else if (infoType === info.fiftyMoves) {
            h1.textContent = 'Draw!'
            p.textContent = 'By the fifty moves rule.'
        } else if (infoType === info.stalemate) {
            h1.textContent = 'Draw!'
            p.textContent = 'By stalemate.'
        } else if (infoType === info.resign) {
            h1.textContent = `${winner === color.white ? 'White' : 'Black'} resigned.`
            p.textContent = `${winner === color.white ? 'Black' : 'White'} is victorious.`
            div.classList.replace(winner === color.white ? 'white' : 'black', winner === color.white ? 'black' : 'white')
        } else if (infoType === info.timeOut) {
            h1.textContent = `${winner === color.white ? 'White' : 'Black'} wins.`
            p.textContent = `By time out.`
            // div.classList.replace(winner === color.white ? 'white' : 'black', winner === color.white ? 'black' : 'white')
        } else {
            h1.textContent = 'Draw!'
            // p.textContent = 'By agreement.'
        }
        div.appendChild(h1)
        div.appendChild(p)

        const buttons = document.createElement('div')
        buttons.classList.add('buttons')

        if (mode !== gamemode.multiplayer) {
            const restartBtn = document.createElement('button')
            restartBtn.textContent = 'Restart'
            restartBtn.onclick = () => {
                restart()
                div.remove()
            }
            buttons.appendChild(restartBtn)
        } else {
            let requesting = false
            const rematchBtn = document.createElement('button')
            rematchBtn.textContent = 'Rematch'
            rematchBtn.onclick = () => {
                if (requesting) return
                requesting = true
                socket.emit('request-rematch')
                rematchBtn.textContent = 'Waiting...'
            }

            socket.on('accepted-rematch', () => {
                restart()
                div.remove()
            })

            socket.on('request-rematch', () => {
                let accepting = false
                rematchBtn.textContent = 'Accept rematch'
                rematchBtn.onclick = () => {
                    if (accepting) return
                    accepting = true
                    socket.emit('request-rematch')
                    rematchBtn.textContent = '...'
                }
            })

            buttons.appendChild(rematchBtn)
        }


        const closeBtn = document.createElement('button')
        closeBtn.textContent = 'Close'
        closeBtn.onclick = () => {
            div.remove()
        }

        buttons.appendChild(closeBtn)

        if (mode === gamemode.multiplayer) {
            const exitBtn = document.createElement('button')
            exitBtn.textContent = 'Exit'
            exitBtn.onclick = () => {
                location.search = ''
            }
            buttons.appendChild(exitBtn)
        }

        div.appendChild(buttons)

        board.appendChild(div)
    }

    function moveStockfish() {
        stockfish.postMessage('go movetime ' + moveTime)
    }

    function analyzeStockfish() {
        stockfish.postMessage('go depth 1')
    }

    document.onkeydown = (e) => {
        if (e.key === ' ') {
            board.classList.toggle('flipped')
        }
    }

    function getPiecesOfColor(color) {
        return pieces.filter(piece => piece.color === color)
    }

    function getPiecesOfType(type) {
        return pieces.filter(piece => piece.type === type)
    }

    function isCheck(checkingColor) {
        generateAttackTiles(oppositeColor(checkingColor))
        const king = getPiecesOfType(type.king).find(piece => piece.color === checkingColor)
        const enemyAttack = attacked[oppositeColor(checkingColor)]
        for (const str in enemyAttack) {
            const split = str.replace('x', '').split('y')
            const x = +split[0]
            const y = +split[1]
            if (x === king.x && y === king.y) return true
        }
        return false
    }

    function isAttack(x, y, color) {
        return attacked[color][posString(x, y)] === true
    }

    function generateAttackTiles(color) {
        attacked[color] = {}
        const piecesOfColor = getPiecesOfColor(color)
        for (const piece of piecesOfColor) {
            const attackedTiles = piece.createAttackTiles()
            for (const attack in attackedTiles) {
                attacked[color][attack] = true
            }
        }
    }

    function clearTiles(key) {
        if (!tiles[key]) return
        tiles[key].forEach(tile => tile.element.remove())
        tiles[key].length = 0
    }

    const obj = {
        start,
        pieces,
        getPiecesOfColor,
        getPiecesOfType,
        isCheck,
        isAttack,
        generateAttackTiles,
        position,
        turn,
        setTurn,
        getTurn,
        tiles,
        enPassant,
        castling,
        clearTiles,
        stop,
        setGameMode,
        setMoveTime,
        startPos,
        movePiece,
        resign
    }


    startPos()

    return obj
}