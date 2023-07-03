import Piece, { oppositeColor, posString } from './piece.js'

import Tile from './tile.js'

import { startPosition } from './startPosition.js'

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
    info,
    letterToType,
} from './constants.js'

import { play } from './sound.js'

import Timer, { secToMs, msToSec, timeString } from './timer.js'

class Move {
    from = {
        x: null,
        y: null,
    }
    to = {
        x: null,
        y: null,
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

export function PuzzleGame(puzzle, board, solvedCallback) {
    const playerColor = puzzle.fen.split(' ')[1] === 'w' ? color.black : color.white
    return Game(gamemode.puzzle, playerColor, board, undefined, undefined, puzzle, solvedCallback)
}

export function Game(gMode, playerColor, board, socket, time, puzzle, solvedCallback, players) {
    time = +time

    let loading = true
    const loadingElement = document.createElement('div')
    loadingElement.classList.add('loading')
    const spinner = document.createElement('div')
    spinner.classList.add('spinner')
    loadingElement.appendChild(spinner)
    if (gMode !== gamemode.placeholder) board.appendChild(loadingElement)
    function checkLoading() {
        if (!loading) return
        if (nnueLoaded && uciok) {
            loading = false
            loadingElement.remove()
        }
    }

    let puzzleMoveIndex = 0

    function getPuzzleMoveIndex() {
        return puzzleMoveIndex
    }

    function getCurrentPuzzleMove() {
        const fullMove = puzzle.moves[puzzleMoveIndex]
        return fullMove.charAt(0) + fullMove.charAt(1) + fullMove.charAt(2) + fullMove.charAt(3)
    }

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
        fullMoves: 1,
        halfMoves: 0,
    }

    const pieces = []

    const tiles = {
        selected: [],
        lastMove: [],
        move: [],
        check: [],
    }
    const castling = {
        Q: true, //white
        K: true, //white
        q: true, //black
        k: true, //black
    }

    function getCastling() {
        return castling
    }
    const enPassant = {
        x: null,
        y: null,
    }

    let mode = gMode

    function getMode() {
        return mode
    }

    function setGameMode(newMode) {
        mode = newMode
    }
    const player = {
        color: playerColor,
    }
    let state = states.start
    let moveTime = 200
    let skillLevel = 10

    function setMoveTime(newMoveTime) {
        moveTime = Math.max(1, newMoveTime)
    }
    // const stockfish = new Worker(`${location.pathname === '/' ? '' : '.'}./lc0/lc0.js`)
    const stockfish = new Worker(`${location.pathname === '/' ? '' : '.'}./stockfish/stockfish.js`)
    let uciok = false
    let nnueLoaded = false

    let isClicking = false

    let draggingPiece

    let ghostPiece

    const attacked = {
        [color.white]: {},
        [color.black]: {},
    }

    if (mode === gamemode.multiplayer || mode === gamemode.spectator) {
        const timers = {
            white: new Timer(secToMs(time)),
            black: new Timer(secToMs(time)),
        }

        const elements = {
            timer: {
                white: document.createElement('div'),
                black: document.createElement('div'),
            },
            info: {
                white: {
                    parent: document.createElement('div'),
                    username: document.createElement('span'),
                    elo: document.createElement('span'),
                },
                black: {
                    parent: document.createElement('div'),
                    username: document.createElement('span'),
                    elo: document.createElement('span'),
                },
            },
        }
        elements.timer.white.classList.add('timer', 'timer-white')
        elements.timer.black.classList.add('timer', 'timer-black')

        elements.info.white.parent.classList.add('player-info', 'info-white')
        elements.info.black.parent.classList.add('player-info', 'info-black')
        elements.info.white.username.classList.add('username')
        elements.info.white.elo.classList.add('elo')
        elements.info.black.username.classList.add('username')
        elements.info.black.elo.classList.add('elo')

        const whiteUsername = players.white?.username || 'Anonymous'
        const blackUsername = players.black?.username || 'Anonymous'
        const whiteElo = players.white?.elo || '800?'
        const blackElo = players.black?.elo || '800?'

        elements.info.white.username.textContent = whiteUsername
        elements.info.white.elo.textContent = whiteElo
        elements.info.black.username.textContent = blackUsername
        elements.info.black.elo.textContent = blackElo

        board.appendChild(elements.timer.white)
        board.appendChild(elements.timer.black)

        elements.info.white.parent.appendChild(elements.info.white.username)
        elements.info.white.parent.appendChild(elements.info.white.elo)
        elements.info.black.parent.appendChild(elements.info.black.username)
        elements.info.black.parent.appendChild(elements.info.black.elo)

        board.appendChild(elements.info.white.parent)
        board.appendChild(elements.info.black.parent)

        setInterval(() => {
            if (state !== states.playing) {
                return
            }
            const secs = {
                white: Math.max(0, msToSec(timers.white.getTime())),
                black: Math.max(0, msToSec(timers.black.getTime())),
            }
            const strings = {
                white: timeString(secs.white),
                black: timeString(secs.black),
            }

            elements.timer.white.textContent = strings.white
            elements.timer.black.textContent = strings.black
        }, 100)

        socket.on('update-elo', (data) => {
            data = +data
            elements.info[player.color].elo.textContent =
                +elements.info[player.color].elo.textContent + data + ''
        })

        socket.on('update-timers', (data) => {
            if (data.running === 'white') {
                timers.black.stop()
                timers.white.start()
                elements.timer.white.classList.add('running')
                elements.timer.black.classList.remove('running')

                if (mode === gamemode.multiplayer) {
                    if (player.color === 'black') document.title = 'Your turn - Chess'
                    else document.title = 'Waiting for opponent - Chess'
                }
            } else if (data.running === 'black') {
                timers.white.stop()
                timers.black.start()
                elements.timer.black.classList.add('running')
                elements.timer.white.classList.remove('running')

                if (mode === gamemode.multiplayer) {
                    if (player.color === 'black') document.title = 'Your turn - Chess'
                    else document.title = 'Waiting for opponent - Chess'
                }
            } else {
                timers.white.stop()
                timers.black.stop()
            }
            if (mode === gamemode.spectator) {
                if (data.running === 'white') {
                    document.title = 'White to move - Chess'
                } else if (data.running === 'black') {
                    document.title = 'Black to move - Chess'
                } else {
                    document.title = 'Chess'
                }
            }
            timers.black.setTime(+data.black)
            timers.white.setTime(+data.white)
        })
    }

    function isLowerCase(str) {
        return str === str.toLowerCase()
    }

    function startPos() {
        clearTiles('check')
        clearTiles('selected')
        clearTiles('move')
        clearTiles('lastMove')

        state = states.start

        isClicking = false
        draggingPiece = null
        ghostPiece = null

        stockfish.postMessage('ucinewgame')
        setSkillLevel(skillLevel, moveTime)
        if (pieces.length > 0) {
            pieces.forEach((piece) => piece.element.remove())
        }
        pieces.length = 0
        if (!puzzle) {
            startPosition.forEach((piece) => {
                const newPiece = new Piece(
                    piece.type,
                    piece.color,
                    piece.x,
                    piece.y,
                    board.querySelector('.board-content'),
                    false,
                    obj,
                )
                newPiece.render()
                pieces.push(newPiece)
            })
            enPassant.x = null
            enPassant.y = null
            castling.q = true
            castling.k = true
            castling.Q = true
            castling.K = true
            position.fullMoves = 1
            position.halfMoves = 0
            turn = color.white
        } else {
            const fenArr = puzzle.fen.split(' ')
            const fenPieces = fenArr[0].split('/')
            const fenRows = fenPieces.length
            //r6k/pp2r2p/4Rp1Q/3p4/8/1N1P2R1/PqP2bPP/7K
            for (let i = 0; i < fenRows; i++) {
                let nextX = 0
                for (let j = 0; j < fenPieces[i].length; j++) {
                    const piece = fenPieces[i][j]
                    if (isNaN(piece)) {
                        const newPiece = new Piece(
                            letterToType[piece.toLowerCase()],
                            isLowerCase(piece) ? color.black : color.white,
                            nextX,
                            i,
                            board.querySelector('.board-content'),
                            false,
                            obj,
                        )
                        newPiece.render()
                        pieces.push(newPiece)
                        nextX++
                    } else {
                        nextX += +piece
                    }
                }
            }
            if (fenArr.length > 1) {
                turn = fenArr[1] === 'w' ? color.white : color.black
            } else {
                turn = color.white
            }

            if (turn === color.white) {
                board.classList.add('flipped')
            } else {
                board.classList.remove('flipped')
            }

            if (fenArr.length > 2) {
                castling.q = fenArr[2].includes('q')
                castling.k = fenArr[2].includes('k')
                castling.Q = fenArr[2].includes('Q')
                castling.K = fenArr[2].includes('K')
            } else {
                castling.q = true
                castling.k = true
                castling.Q = true
                castling.K = true
            }

            if (fenArr.length > 3) {
                if (fenArr[3] === '-') {
                    enPassant.x = null
                    enPassant.y = null
                } else {
                    enPassant.x = +moveNumber[`x${fenArr[3].charAt(0)}`]
                    enPassant.y = +moveNumber[`y${fenArr[3].charAt(1)}`]
                }
            } else {
                enPassant.x = null
                enPassant.y = null
            }

            if (fenArr.length > 4) {
                position.halfMoves = +fenArr[4]
            } else {
                position.halfMoves = 0
            }

            if (fenArr.length > 5) {
                position.fullMoves = +fenArr[5]
            } else {
                position.fullMoves = 0
            }
        }

        position.fen = fenString()
        position.movesHistory = `position fen ${position.fen} moves`
        stockfish.postMessage(`position fen ${position.fen}`)
        position.fenHistory.length = 0
        position.fenHistory.push(position.fen)
    }

    function stop() {
        stockfish.onmessage = null
        pieces.forEach((piece) => piece.element.remove())
        board.querySelectorAll('.tile').forEach((tile) => tile.remove())
        state = states.end
        board.onmousedown = null
        board.onmouseleave = null
        board.onmouseup = null
        board.onmousemove = null
    }

    function start() {
        if (mode === gamemode.placeholder) return

        clearTiles('check')
        clearTiles('selected')
        clearTiles('move')
        clearTiles('lastMove')

        try {
            board.querySelector('.playing-as').textContent = `Playing as ${
                player.color === color.white ? 'White' : 'Black'
            }`
            board.querySelector('.playing-as').classList.add(player.color)
        } catch (e) {}

        if (toMoveDiv) toMoveDiv.textContent = 'White to move'
        if (toMoveDiv) toMoveDiv.classList.add(turn)

        play.start()

        state = states.playing

        if (mode === gamemode.puzzle) {
            setTimeout(() => {
                nextPuzzleMove()
            }, 700)
        }
        setTimeout(() => {
            if (mode === gamemode.computerVsComputer) moveStockfish()
            if (mode === gamemode.playerVsComputer && player.color === color.black) moveStockfish()
        }, 500)
    }

    function restart() {
        startPos()
        start()
    }

    function getClientRect() {
        return board.getBoundingClientRect()
    }

    board.onmousedown = ({ target, clientX, clientY }) => {
        if (mode === gamemode.spectator || mode === gamemode.placeholder) return

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
        } else if (
            mode === gamemode.playerVsComputer ||
            mode === gamemode.multiplayer ||
            mode === gamemode.puzzle
        ) {
            if (clickedPiece.color !== player.color || clickedPiece.color !== turn) {
                return
            }
        }
        isClicking = true
        const boardRect = getClientRect()
        const pos = {
            x: clientX - boardRect.left,
            y: clientY - boardRect.top,
        }
        draggingPiece = clickedPiece
        draggingPiece.moveElement(pos.x, pos.y)
        draggingPiece.createLegalMoves()
        draggingPiece.element.classList.add('dragging')

        ghostPiece = new Piece(
            draggingPiece.type,
            draggingPiece.color,
            draggingPiece.x,
            draggingPiece.y,
            board.querySelector('.board-content'),
            true,
            obj,
        )
        ghostPiece.render()

        const newTile = new Tile(
            draggingPiece.x,
            draggingPiece.y,
            board.querySelector('.board-content'),
            tile.selected,
        )
        tiles.selected.push(newTile)

        for (const key in draggingPiece.legalMoves) {
            const posArray = key.replace('x', '').split('y')
            const x = posArray[0]
            const y = posArray[1]
            tiles.move.push(
                new Tile(
                    x,
                    y,
                    board.querySelector('.board-content'),
                    draggingPiece.legalMoves[key] ? tile.capture : tile.move,
                ),
            )
        }
    }
    board.onmouseleave = () => {
        if (mode === gamemode.spectator || mode === gamemode.placeholder) return
        board
            .querySelectorAll('piece.dragging')
            .forEach((piece) => piece.classList.remove('dragging'))
        resetAllPieces()
        isClicking = false
        if (ghostPiece) {
            ghostPiece.element.remove()
            ghostPiece = null
        }
    }

    //!MOVE
    board.onmouseup = ({ clientX, clientY }) => {
        if (mode === gamemode.spectator || mode === gamemode.placeholder) return
        if (state !== states.playing) return
        if (!isClicking) return
        isClicking = false
        board
            .querySelectorAll('piece.dragging')
            .forEach((piece) => piece.classList.remove('dragging'))
        move(clientX, clientY)
    }

    function movePiece(from, to) {
        const piece = pieces.find((piece) => piece.x === from.x && piece.y === from.y)
        if (piece) {
            const moveResult = piece.move(to.x, to.y, true)
            if (moveResult) {
                hasMoved(piece)
                updatePosition(
                    `${from.x}${from.y}`,
                    `${to.x}${to.y}`,
                    moveResult === 'q' ? 'q' : undefined,
                )
            }
        }
        analyzeStockfish()
    }

    function nextPuzzleMove() {
        const move = puzzle.moves[puzzleMoveIndex]
        const moveNumber = moveStringToNumber(move)
        const split = moveNumber.split('')
        const piece = pieces.find((piece) => piece.x == split[0] && piece.y == split[1])
        if (!piece) return
        piece.move(split[2], split[3], true)
        if (hasMoved(piece)) {
            updatePosition(split[0] + split[1], split[2] + split[3], split[4])
            return
        }
        updatePosition(split[0] + split[1], split[2] + split[3], split[4])
        puzzleMoveIndex++
    }

    function move(clientX, clientY) {
        if (mode === gamemode.spectator || mode === gamemode.placeholder) return
        if (!draggingPiece) return
        const boardRect = getClientRect()
        const pos = {
            x: clientX - boardRect.left,
            y: clientY - boardRect.top,
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
                if (mode === gamemode.puzzle) {
                    if (puzzleMoveIndex === puzzle.moves.length - 1) {
                        state = states.end
                        try {
                            solvedCallback()
                        } catch (e) {}
                        return
                    }
                    puzzleMoveIndex++
                    nextPuzzleMove()
                }
                if (mode === gamemode.multiplayer && socket) {
                    socket.emit(
                        'move',
                        new Move(
                            +from.split('')[0],
                            +from.split('')[1],
                            x,
                            y,
                            moveResult === 'q' ? 'q' : undefined,
                        ),
                    )
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
        const fenHistory = position.fenHistory.filter(
            (item, index) => position.fenHistory.indexOf(item) === index,
        )
        const fenHistoryCount = fenHistory.map(
            (item) => position.fenHistory.filter((i) => i === item).length,
        )
        const repetition = fenHistoryCount.filter((item) => item > 2)
        return repetition.length > 0
    }

    function draw(str) {
        if (socket && mode === gamemode.multiplayer) {
            socket.emit('draw')
        }
        showInfo(info[str] || info.draw)
    }

    function removeGhostPiece() {
        if (ghostPiece) {
            ghostPiece.element.remove()
            ghostPiece = null
        }
    }

    function clearTiles(key) {
        try {
            board.querySelectorAll(`.${key}`).forEach((item) => item.remove())
        } catch (e) {}

        if (!tiles[key]) return
        tiles[key].forEach((tile) => tile.element.remove())
        tiles[key].length = 0
    }

    function findPiece(element) {
        return pieces.find((piece) => {
            return piece.element === element
        })
    }

    function resetAllPieces() {
        pieces.forEach((piece) => piece.resetPosition())
    }

    board.onmousemove = (e) => {
        if (!isClicking || !draggingPiece) return
        const boardRect = getClientRect()
        const pos = {
            x: e.clientX - boardRect.left,
            y: e.clientY - boardRect.top,
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
                const piece = pieces.find((piece) => piece.x === x && piece.y === y)
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
        if (
            castling.Q === false &&
            castling.q === false &&
            castling.K === false &&
            castling.k === false
        ) {
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

        return fen
    }

    function moveStringToNumber(str) {
        const split = str.split('')
        if (split.length === 4) {
            return (
                moveNumber['x' + split[0]] +
                moveNumber['y' + split[1]] +
                moveNumber['x' + split[2]] +
                moveNumber['y' + split[3]]
            )
        }
        if (split.length === 2) {
            return moveNumber['x' + split[0]] + moveNumber['y' + split[1]]
        }
        if (split.length === 5) {
            return (
                moveNumber['x' + split[0]] +
                moveNumber['y' + split[1]] +
                moveNumber['x' + split[2]] +
                moveNumber['y' + split[3]] +
                split[4]
            )
        }
    }

    function moveNumberToString(num) {
        const split = num.split('')
        if (split.length === 4) {
            return (
                moveString['x' + split[0]] +
                moveString['y' + split[1]] +
                moveString['x' + split[2]] +
                moveString['y' + split[3]]
            )
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

    //!STOCKFISH
    stockfish.onmessage = ({ data }) => {
        if (data === 'uciok') uciok = true
        if (data === 'Load eval file success: 1') nnueLoaded = true
        checkLoading()

        if (state === states.end || state === states.start) return

        if (data.includes('checkmate') || data === 'info depth 0 score mate 0') {
            checkmate(oppositeColor(turn))
            return
        }

        if (!data.includes('bestmove')) return

        if (data.includes('(none)')) {
            if (state === states.playing) stalemate()
            return
        }

        if (mode !== gamemode.playerVsComputer && mode !== gamemode.computerVsComputer) return
        if (mode === gamemode.playerVsComputer && turn === player.color) return

        const dataArr = data.split(' ')
        const move = dataArr[1]
        const moveNumber = moveStringToNumber(move)
        const split = moveNumber.split('')
        const piece = pieces.find((piece) => piece.x == split[0] && piece.y == split[1])
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

    if (socket) {
        socket.on('time-out', timeOut)
        socket.on('player-disconnected', (color) => {
            if (state === states.playing) {
                play.end()
                state = states.end
                showInfo(info.playerDisconnected, color === 'black' ? 'white' : 'black')
            }
        })
    }

    function timeOut(lostColor) {
        if (state === states.playing) {
            try {
                board.querySelector(`.timer .timer-${lostColor}`).textContent = '0:00.00'
            } catch (e) {}
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
            p.textContent = 'By the fifty move rule.'
        } else if (infoType === info.stalemate) {
            h1.textContent = 'Draw!'
            p.textContent = 'By stalemate.'
        } else if (infoType === info.resign) {
            h1.textContent = `${winner === color.white ? 'White' : 'Black'} resigned.`
            p.textContent = `${winner === color.white ? 'Black' : 'White'} is victorious.`
            div.classList.replace(
                winner === color.white ? 'white' : 'black',
                winner === color.white ? 'black' : 'white',
            )
        } else if (infoType === info.timeOut) {
            h1.textContent = `${winner === color.white ? 'White' : 'Black'} wins.`
            p.textContent = `By time out.`
            // div.classList.replace(winner === color.white ? 'white' : 'black', winner === color.white ? 'black' : 'white')
        } else if (infoType === info.playerDisconnected) {
            h1.textContent = 'Player disconnected'
            p.textContent = `${winner === color.white ? 'White' : 'Black'} is victorious.`
        } else {
            h1.textContent = 'Draw!'
            // p.textContent = 'By agreement.'
        }
        board.querySelector('.stop-btn').textContent = 'Exit'
        board.querySelector('.stop-btn').onclick = () => {
            location.search = ''
        }
        div.appendChild(h1)
        div.appendChild(p)

        const buttons = document.createElement('div')
        buttons.classList.add('buttons')

        if (mode !== gamemode.multiplayer && mode !== gamemode.spectator) {
            const restartBtn = document.createElement('button')
            restartBtn.textContent = 'Restart'
            restartBtn.onclick = () => {
                restart()
                div.remove()
            }
            buttons.appendChild(restartBtn)
        } else if (mode === gamemode.multiplayer) {
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
                board.querySelector('.stop-btn').textContent = 'Resign'
                board.querySelector('.stop-btn').onclick = () => {
                    if (socket) socket.emit('resign')
                }
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

        if (mode === gamemode.multiplayer || mode === gamemode.spectator) {
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
        if (!uciok || !nnueLoaded) return setTimeout(moveStockfish, 100)
        stockfish.postMessage('go movetime ' + moveTime)
    }

    function analyzeStockfish() {
        if (!uciok || !nnueLoaded) return setTimeout(analyzeStockfish, 100)
        stockfish.postMessage('go depth 1')
    }

    document.onkeydown = (e) => {
        if (e.key === ' ') {
            board.classList.toggle('flipped')
        }
    }

    function getPiecesOfColor(color) {
        return pieces.filter((piece) => piece.color === color)
    }

    function getPiecesOfType(type) {
        return pieces.filter((piece) => piece.type === type)
    }

    function isCheck(checkingColor) {
        generateAttackTiles(oppositeColor(checkingColor))
        const king = getPiecesOfType(type.king).find((piece) => piece.color === checkingColor)
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
        tiles[key].forEach((tile) => tile.element.remove())
        tiles[key].length = 0
    }

    stockfish.postMessage('uci')
    stockfish.postMessage('setoption name Use NNUE value true')
    stockfish.postMessage('isready')
    function setSkillLevel(level, time) {
        skillLevel = level
        stockfish.postMessage('setoption name Skill Level value ' + skillLevel)
        setMoveTime(time)
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
        getMode,
        setMoveTime,
        startPos,
        movePiece,
        resign,
        getPuzzleMoveIndex,
        getCurrentPuzzleMove,
        setSkillLevel,
    }

    startPos()

    return obj
}
