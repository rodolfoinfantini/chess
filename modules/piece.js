import Tile from './tile.js'

import {
    play
} from './sound.js'

import {
    type,
    color,
    tile
} from './constants.js'

export const position = {
    fen: '',
    movesHistory: 'position startpos moves',
    fenHistory: [],
    fullMoves: 0,
    halfMoves: 0
}

export const pieces = []
export let turn = color.white
export const tiles = {
    selected: [],
    lastMove: [],
    move: [],
    check: []
}
export const castling = {
    Q: true, //white
    K: true, //white
    q: true, //black
    k: true //black
}

export const enPassant = {
    x: null,
    y: null
}

export const attacked = {
    [color.white]: {},
    [color.black]: {}
}

export default class Piece {
    x
    y
    color
    type
    boardElement
    element
    ghost
    legalMoves = {}
    lastRow = 0
    hasMoved = false
    constructor(type = type.pawn, pieceColor = color.white, x = 0, y = 0, boardElement, ghost = false) {
        this.type = type
        this.color = pieceColor
        this.x = x
        this.y = y
        this.boardElement = boardElement
        this.ghost = ghost
        this.lastRow = this.color == color.white ? 0 : 7
    }
    render() {
        this.boardElement.appendChild(this.createElement())
    }
    createElement() {
        this.element = document.createElement('piece')
        // this.element.classList.add('piece')
        if (this.ghost) this.element.classList.add('ghost')
        this.element.classList.add(this.type)
        this.element.classList.add(this.color)
        this.setElementPosition()
        const img = new Image()
        img.src = this.getImgSrc()
        this.element.appendChild(img)
        return this.element
    }
    moveElement(xPx, yPx) {
        if (this.boardElement.classList.contains('flipped')) {
            xPx = this.boardElement.offsetWidth - xPx
            yPx = this.boardElement.offsetHeight - yPx
        }
        this.element.style.transform = `translateX(${xPx - (this.element.offsetWidth / 2)}px) translateY(${yPx - (this.element.offsetHeight / 2)}px)`
    }
    canMove(x, y) {
        //if (turn !== this.color) return false
        /* const move = this.legalMoves.find(move => move.x === x && move.y === y)
        return move != undefined */
        return this.legalMoves[posString(x, y)] != undefined
    }
    hasPiece(x, y) {
        return pieces.find(piece => piece.x === x && piece.y === y)
    }
    move(x, y, force = false) {
        x = +x
        y = +y
        if (!this.canMove(x, y) && !force) {
            this.resetPosition()
            return false
        }
        clearTiles('move')
        clearTiles('selected')
        const oldHalfMoves = position.halfMoves
        console.log(oldHalfMoves)
        let capture = false
        const piece = this.hasPiece(x, y)
        if (this.type === type.pawn && x === enPassant.x && y === enPassant.y) {
            capture = this.hasPiece(x, this.color === color.white ? 3 : 4)
        } else if (piece) capture = piece
        else {
            play.move()
            position.halfMoves++
        }
        if (capture) capture.capture()
        if (this.type === type.rook) {
            if (this.x === 0 && this.y === 7) {
                castling.Q = false
            } else if (this.x === 0 && this.y === 0) {
                castling.q = false
            } else if (this.x === 7 && this.y === 7) {
                castling.K = false
            } else if (this.x === 7 && this.y === 0) {
                castling.k = false
            }
        }
        if (this.type === type.king && this.hasMoved === false) {
            castling[this.color === color.white ? 'Q' : 'q'] = false
            castling[this.color === color.white ? 'K' : 'k'] = false
            if (x === 6) {
                play.stop()
                play.castle()
                const rook = this.hasPiece(7, y)
                rook.x = 5
                rook.resetPosition()
            } else if (x === 2) {
                play.stop()
                play.castle()
                const rook = this.hasPiece(0, y)
                rook.x = 3
                rook.resetPosition()
            }
        }
        enPassant.x = null
        enPassant.y = null
        if (this.checkEnPassant(y)) {
            enPassant.x = this.x
            enPassant.y = this.color === color.white ? 5 : 2
        }
        const oldX = this.x
        const oldY = this.y
        //!CHANGE POSITION
        this.x = x
        this.y = y
        generateAttackTiles(this.color === color.white ? color.black : color.white)
        if (isCheck(this.color)) {
            if (capture) {
                position.halfMoves = oldHalfMoves
                pieces.push(capture)
                this.boardElement.appendChild(capture.element)
            }
            play.stop()
            this.x = oldX
            this.y = oldY
            this.resetPosition()
            return false
        }
        this.hasMoved = true
        clearTiles('lastMove')
        clearTiles('check')
        this.setElementPosition()
        tiles.lastMove.push(new Tile(oldX, oldY, this.boardElement, tile.lastMove))
        tiles.lastMove.push(new Tile(this.x, this.y, this.boardElement, tile.lastMove))
        if (this.y === this.lastRow && this.type === type.pawn) {
            this.element.classList.remove(this.type)
            this.type = type.queen
            this.element.classList.add(this.type)
            this.element.querySelector('img').src = this.getImgSrc()
        }
        generateAttackTiles(turn)
        turn = turn === color.white ? color.black : color.white
        if (isCheck(turn)) {
            console.log('check')
            const king = getPiecesOfType(type.king).find(piece => piece.color === turn)
            tiles.check.push(new Tile(king.x, king.y, this.boardElement, tile.check))
        }
        return true
    }
    checkEnPassant(toY) {
        if (!this.type === type.pawn) return false
        if (this.hasMoved) return false
        if (this.color === color.white && toY === 4) return true
        if (this.color === color.black && toY === 3) return true
        return false
    }
    resetPosition() {
        this.setElementPosition()
    }
    setElementPosition() {
        this.element.style.transform = `translateX(${this.x * 100}%) translateY(${this.y * 100}%)`
    }
    getImgSrc() {
        return `../assets/pieces/${this.color}-${this.type}.svg`
    }
    capture() {
        position.halfMoves = 0
        pieces.splice(pieces.indexOf(this), 1)
        this.boardElement.removeChild(this.element)
        play.stop()
        play.capture()
    }
    canCapture(x, y) {
        const piece = this.hasPiece(x, y)
        if (piece) return piece.color !== this.color
        return false
    }
    setTurn(color) {
        turn = color
    }



    createLegalMoves() {
        this.legalMoves = {}
        if (this.type === type.pawn) this.createPawnMoves()
        else if (this.type === type.rook) this.createRookMoves()
        else if (this.type === type.knight) this.createKnightMoves()
        else if (this.type === type.bishop) this.createBishopMoves()
        else if (this.type === type.queen) this.createQueenMoves()
        else if (this.type === type.king) this.createKingMoves()
    }
    createAttackPawnMoves() {
        const direction = this.color === color.white ? -1 : 1
        const diagonalLeft = {
            x: this.x - 1,
            y: this.y + direction
        }
        const diagonalRight = {
            x: this.x + 1,
            y: this.y + direction
        }
        /* if (this.canCapture(diagonalLeft.x, diagonalLeft.y)) */
        if (diagonalLeft.x >= 0 && diagonalLeft.x <= 7 && diagonalLeft.y >= 0 && diagonalLeft.y <= 7) this.legalMoves[posString(diagonalLeft.x, diagonalLeft.y)] = true
        /* if (this.canCapture(diagonalRight.x, diagonalRight.y))  */
        if (diagonalRight.x >= 0 && diagonalRight.x <= 7 && diagonalRight.y >= 0 && diagonalRight.y <= 7) this.legalMoves[posString(diagonalRight.x, diagonalRight.y)] = true
    }
    createPawnMoves() {
        const direction = this.color === color.white ? -1 : 1
        const initialRow = this.color === color.white ? 6 : 1
        const firstMove = this.y + direction
        if (!this.hasPiece(this.x, firstMove)) {
            this.legalMoves[posString(this.x, firstMove)] = false
            if (this.y === initialRow) {
                const secondMove = this.y + (direction * 2)
                if (!this.hasPiece(this.x, secondMove)) {
                    this.legalMoves[posString(this.x, secondMove)] = false
                }
            }
        }
        const diagonalLeft = {
            x: this.x - 1,
            y: this.y + direction
        }
        const diagonalRight = {
            x: this.x + 1,
            y: this.y + direction
        }
        if (this.canCapture(diagonalLeft.x, diagonalLeft.y)) this.legalMoves[posString(diagonalLeft.x, diagonalLeft.y)] = true
        if (this.canCapture(diagonalRight.x, diagonalRight.y)) this.legalMoves[posString(diagonalRight.x, diagonalRight.y)] = true

        // en passant
        if (this.y === 3 && this.color === color.white && enPassant.y === 2) {
            const leftPawn = this.hasPiece(this.x - 1, this.y)
            if (leftPawn && leftPawn.type === type.pawn && enPassant.x === this.x - 1) {
                this.legalMoves[posString(enPassant.x, enPassant.y)] = false
            }
            const rightPawn = this.hasPiece(this.x + 1, this.y)
            if (rightPawn && rightPawn.type === type.pawn && enPassant.x === this.x + 1) {
                this.legalMoves[posString(enPassant.x, enPassant.y)] = false
            }
        } else if (this.y === 4 && this.color === color.black && enPassant.y === 5) {
            const leftPawn = this.hasPiece(this.x - 1, this.y)
            if (leftPawn && leftPawn.type === type.pawn && enPassant.x === this.x - 1) {
                this.legalMoves[posString(enPassant.x, enPassant.y)] = false
            }
            const rightPawn = this.hasPiece(this.x + 1, this.y)
            if (rightPawn && rightPawn.type === type.pawn && enPassant.x === this.x + 1) {
                this.legalMoves[posString(enPassant.x, enPassant.y)] = false
            }
        }
    }
    createRookMoves() {
        const directions = [{
                x: 1,
                y: 0
            },
            {
                x: -1,
                y: 0
            },
            {
                x: 0,
                y: 1
            },
            {
                x: 0,
                y: -1
            }
        ]
        for (let direction of directions) {
            let x = this.x + direction.x
            let y = this.y + direction.y
            while (x >= 0 && x <= 7 && y >= 0 && y <= 7) {
                if (this.canCapture(x, y)) {
                    this.legalMoves[posString(x, y)] = true
                    break
                }
                if (this.hasPiece(x, y)) break
                this.legalMoves[posString(x, y)] = false
                x += direction.x
                y += direction.y
            }
        }
    }
    createKnightMoves() {
        const directions = [{
                x: 2,
                y: 1
            },
            {
                x: 2,
                y: -1
            },
            {
                x: -2,
                y: 1
            },
            {
                x: -2,
                y: -1
            },
            {
                x: 1,
                y: 2
            },
            {
                x: 1,
                y: -2
            },
            {
                x: -1,
                y: 2
            },
            {
                x: -1,
                y: -2
            }
        ]
        for (let direction of directions) {
            let x = this.x + direction.x
            let y = this.y + direction.y
            if (x >= 0 && x <= 7 && y >= 0 && y <= 7) {
                if (this.canCapture(x, y)) {
                    this.legalMoves[posString(x, y)] = true
                } else if (!this.hasPiece(x, y)) {
                    this.legalMoves[posString(x, y)] = false
                }
            }
        }
    }
    createBishopMoves() {
        const directions = [{
                x: 1,
                y: 1
            },
            {
                x: 1,
                y: -1
            },
            {
                x: -1,
                y: 1
            },
            {
                x: -1,
                y: -1
            }
        ]
        for (let direction of directions) {
            let x = this.x + direction.x
            let y = this.y + direction.y
            while (x >= 0 && x <= 7 && y >= 0 && y <= 7) {
                if (this.canCapture(x, y)) {
                    this.legalMoves[posString(x, y)] = true
                    break
                }
                if (this.hasPiece(x, y)) break
                this.legalMoves[posString(x, y)] = false
                x += direction.x
                y += direction.y
            }
        }
    }
    createQueenMoves() {
        this.createRookMoves()
        this.createBishopMoves()
    }
    createKingMoves(attack = false) {
        const directions = [{
                x: 1,
                y: 1
            },
            {
                x: 1,
                y: -1
            },
            {
                x: -1,
                y: 1
            },
            {
                x: -1,
                y: -1
            },
            {
                x: 1,
                y: 0
            },
            {
                x: -1,
                y: 0
            },
            {
                x: 0,
                y: 1
            },
            {
                x: 0,
                y: -1
            }
        ]
        for (let direction of directions) {
            let x = this.x + direction.x
            let y = this.y + direction.y
            if (x >= 0 && x <= 7 && y >= 0 && y <= 7) {
                if (this.canCapture(x, y)) {
                    this.legalMoves[posString(x, y)] = true
                } else if (!this.hasPiece(x, y)) {
                    this.legalMoves[posString(x, y)] = false
                }
            }
        }
        //castle
        if (this.hasMoved === false && attack === false) {
            if (this.color === color.black) {
                if (this.hasPiece(5, 0) === undefined && this.hasPiece(6, 0) === undefined) {
                    const rook = this.hasPiece(7, 0)
                    if (rook != undefined && rook.hasMoved === false) {
                        this.legalMoves[posString(6, 0)] = false
                    }
                }
                if (this.hasPiece(1, 0) === undefined && this.hasPiece(2, 0) === undefined && this.hasPiece(3, 0) === undefined) {
                    const rook = this.hasPiece(0, 0)
                    if (rook != undefined && rook.hasMoved === false) {
                        this.legalMoves[posString(2, 0)] = false
                    }
                }
            } else if (this.color === color.white) {
                if (this.hasPiece(5, 7) === undefined && this.hasPiece(6, 7) === undefined) {
                    const rook = this.hasPiece(7, 7)
                    if (rook != undefined && rook.hasMoved === false) {
                        this.legalMoves[posString(6, 7)] = false
                    }
                }
                if (this.hasPiece(1, 7) === undefined && this.hasPiece(2, 7) === undefined && this.hasPiece(3, 7) === undefined) {
                    const rook = this.hasPiece(0, 7)
                    if (rook != undefined && rook.hasMoved === false) {
                        this.legalMoves[posString(2, 7)] = false
                    }
                }
            }
        }
    }
    createAttackTiles() {
        this.legalMoves = {}
        if (this.type === type.pawn) this.createAttackPawnMoves()
        else if (this.type === type.rook) this.createRookMoves()
        else if (this.type === type.knight) this.createKnightMoves()
        else if (this.type === type.bishop) this.createBishopMoves()
        else if (this.type === type.queen) this.createQueenMoves()
        else if (this.type === type.king) this.createKingMoves(true)
        return this.legalMoves
    }
}

function posString(x, y) {
    return `x${x}y${y}`
}

function clearTiles(key) {
    if (!tiles[key]) return
    tiles[key].forEach(tile => tile.element.remove())
    tiles[key].length = 0
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

function getPiecesOfColor(color) {
    return pieces.filter(piece => piece.color === color)
}

function getPiecesOfType(type) {
    return pieces.filter(piece => piece.type === type)
}

export function isCheck(checkingColor) {
    const king = getPiecesOfType(type.king).find(piece => piece.color === checkingColor)
    const enemyAttack = attacked[checkingColor === color.black ? color.white : color.black]
    for (const str in enemyAttack) {
        const split = str.replace('x', '').split('y')
        const x = +split[0]
        const y = +split[1]
        if (x === king.x && y === king.y) return true
    }
    return false
}