import Tile from './tile.js'

import { play } from './sound.js'

import {
    type,
    color,
    tile,
    gamemode,
    moveString,
    colorLetter,
    typeLetter,
} from './constants.js'

const skins = {
    s0: 'skin0',
    s1: 'skin1',
    s2: 'skin2',
    s3: 'skin3',
    s4: 'skin4',
    s5: 'skin5',
    s6: 'skin6',
    s7: 'skin7',
    s8: 'skin8',
    s9: 'skin9',
    s10: 'skin10',
    s11: 'skin11',
    s12: 'skin12',
    s13: 'skin13',
    s14: 'skin14',
    s15: 'skin15',
    s16: 'skin16',
    s17: 'skin17',
    s18: 'skin18',
    s19: 'skin19',
    s20: 'skin20',
    s21: 'skin21',
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
    game
    constructor(
        type = type.pawn,
        pieceColor = color.white,
        x = 0,
        y = 0,
        boardElement,
        ghost = false,
        game = {}
    ) {
        this.type = type
        this.color = pieceColor
        this.x = x
        this.y = y
        this.boardElement = boardElement
        this.ghost = ghost
        this.lastRow = this.color == color.white ? 0 : 7
        this.game = game
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
        if (this.boardElement.parentElement.classList.contains('flipped')) {
            xPx = this.boardElement.offsetWidth - xPx
            yPx = this.boardElement.offsetHeight - yPx
        }
        this.element.style.transform = `translateX(${
            xPx - this.element.offsetWidth / 2
        }px) translateY(${yPx - this.element.offsetHeight / 2}px)`
    }
    canMove(x, y) {
        return this.legalMoves[posString(x, y)] != undefined
    }
    hasPiece(x, y) {
        return this.game.pieces.find((piece) => piece.x === x && piece.y === y)
    }
    move(x, y, force = false) {
        x = +x
        y = +y

        if (!this.canMove(x, y) && !force) {
            this.resetPosition()
            return false
        }

        if (this.game.getMode() === gamemode.puzzle) {
            const curMove = this.game.getCurrentPuzzleMove()
            const moveStr = `${moveString['x' + this.x]}${
                moveString['y' + this.y]
            }${moveString['x' + x]}${moveString['y' + y]}`
            if (curMove !== moveStr) {
                setTimeout(() => {
                    this.resetPosition()
                }, 10)
                return false
            }
        }

        this.game.clearTiles('move')
        this.game.clearTiles('selected')
        const oldHalfMoves = this.game.position.halfMoves
        let capture = false
        const piece = this.hasPiece(x, y)
        if (
            this.type === type.pawn &&
            x === this.game.enPassant.x &&
            y === this.game.enPassant.y
        ) {
            capture = this.hasPiece(x, this.color === color.white ? 3 : 4)
        } else if (piece) capture = piece
        else {
            play.move()
            this.game.position.halfMoves++
        }
        if (capture) capture.capture()
        if (this.type === type.rook) {
            if (this.x === 0 && this.y === 7) {
                this.game.castling.Q = false
            } else if (this.x === 0 && this.y === 0) {
                this.game.castling.q = false
            } else if (this.x === 7 && this.y === 7) {
                this.game.castling.K = false
            } else if (this.x === 7 && this.y === 0) {
                this.game.castling.k = false
            }
        }
        let reverseCastling1 = false
        let reverseCastling2 = false
        if (this.type === type.king && !this.hasMoved) {
            if (
                x === 6 &&
                this.game.castling[this.color === color.white ? 'K' : 'k']
            ) {
                play.stop()
                play.castle()
                const rook = this.hasPiece(7, y)
                rook.x = 5
                rook.resetPosition()
            } else if (
                x === 2 &&
                this.game.castling[this.color === color.white ? 'K' : 'k']
            ) {
                play.stop()
                play.castle()
                const rook = this.hasPiece(0, y)
                rook.x = 3
                rook.resetPosition()
            }

            if (this.game.castling[this.color === color.white ? 'Q' : 'q']) {
                this.game.castling[
                    this.color === color.white ? 'Q' : 'q'
                ] = false
                reverseCastling1 = this.color === color.white ? 'Q' : 'q'
            }
            if (this.game.castling[this.color === color.white ? 'K' : 'k']) {
                this.game.castling[
                    this.color === color.white ? 'K' : 'k'
                ] = false
                reverseCastling2 = this.color === color.white ? 'K' : 'k'
            }
        }
        this.game.enPassant.x = null
        this.game.enPassant.y = null
        if (this.checkEnPassant(y)) {
            this.game.enPassant.x = this.x
            this.game.enPassant.y = this.color === color.white ? 5 : 2
        }
        const oldX = this.x
        const oldY = this.y
        //!CHANGE POSITION
        this.x = x
        this.y = y
        if (this.game.isCheck(this.color)) {
            if (capture) {
                this.game.position.halfMoves = oldHalfMoves
                this.game.pieces.push(capture)
                this.boardElement.appendChild(capture.element)
            }
            if (reverseCastling1) {
                this.game.castling[reverseCastling1] = true
            }
            if (reverseCastling2) {
                this.game.castling[reverseCastling2] = true
            }
            play.stop()
            this.x = oldX
            this.y = oldY
            this.resetPosition()
            return false
        }
        this.hasMoved = true
        this.game.clearTiles('lastMove')
        this.game.clearTiles('check')
        this.setElementPosition()
        this.game.tiles.lastMove.push(
            new Tile(oldX, oldY, this.boardElement, tile.lastMove)
        )
        this.game.tiles.lastMove.push(
            new Tile(this.x, this.y, this.boardElement, tile.lastMove)
        )
        let returning = true
        if (this.y === this.lastRow && this.type === type.pawn) {
            this.element.classList.remove(this.type)
            this.type = type.queen
            this.element.classList.add(this.type)
            this.element.querySelector('img').src = this.getImgSrc()
            returning = 'q'
        }
        this.game.setTurn(oppositeColor(this.game.getTurn()))
        if (this.game.isCheck(this.game.getTurn())) {
            const king = this.game
                .getPiecesOfType(type.king)
                .find((piece) => piece.color === this.game.getTurn())
            this.game.tiles.check.push(
                new Tile(king.x, king.y, this.boardElement, tile.check)
            )
        }
        return returning
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
        this.element.style.transform = `translateX(${
            this.x * 100
        }%) translateY(${this.y * 100}%)`
    }
    getImgSrc() {
        const selectedSkin =
            (localStorage.getItem('preferences')
                ? JSON.parse(localStorage.getItem('preferences')).skin
                : '0') ?? '0'
        return `${location.pathname === '/' ? '' : '../'}assets/pieces/${
            skins['s' + selectedSkin] ?? skins['s0']
        }/${colorLetter[this.color]}${typeLetter[this.type]}.svg`
    }
    capture() {
        this.game.position.halfMoves = 0
        this.game.pieces.splice(this.game.pieces.indexOf(this), 1)
        this.boardElement.removeChild(this.element)
        play.stop()
        play.capture()
    }
    canCapture(x, y) {
        const piece = this.hasPiece(x, y)
        if (piece) return piece.color !== this.color
        return false
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
            y: this.y + direction,
        }
        const diagonalRight = {
            x: this.x + 1,
            y: this.y + direction,
        }
        /* if (this.canCapture(diagonalLeft.x, diagonalLeft.y)) */
        if (
            diagonalLeft.x >= 0 &&
            diagonalLeft.x <= 7 &&
            diagonalLeft.y >= 0 &&
            diagonalLeft.y <= 7
        )
            this.legalMoves[posString(diagonalLeft.x, diagonalLeft.y)] = true
        /* if (this.canCapture(diagonalRight.x, diagonalRight.y))  */
        if (
            diagonalRight.x >= 0 &&
            diagonalRight.x <= 7 &&
            diagonalRight.y >= 0 &&
            diagonalRight.y <= 7
        )
            this.legalMoves[posString(diagonalRight.x, diagonalRight.y)] = true
    }
    createPawnMoves() {
        const direction = this.color === color.white ? -1 : 1
        const initialRow = this.color === color.white ? 6 : 1
        const firstMove = this.y + direction
        if (!this.hasPiece(this.x, firstMove)) {
            this.legalMoves[posString(this.x, firstMove)] = false
            if (this.y === initialRow) {
                const secondMove = this.y + direction * 2
                if (!this.hasPiece(this.x, secondMove)) {
                    this.legalMoves[posString(this.x, secondMove)] = false
                }
            }
        }
        const diagonalLeft = {
            x: this.x - 1,
            y: this.y + direction,
        }
        const diagonalRight = {
            x: this.x + 1,
            y: this.y + direction,
        }
        if (this.canCapture(diagonalLeft.x, diagonalLeft.y))
            this.legalMoves[posString(diagonalLeft.x, diagonalLeft.y)] = true
        if (this.canCapture(diagonalRight.x, diagonalRight.y))
            this.legalMoves[posString(diagonalRight.x, diagonalRight.y)] = true

        // en passant
        if (
            this.y === 3 &&
            this.color === color.white &&
            this.game.enPassant.y === 2
        ) {
            const leftPawn = this.hasPiece(this.x - 1, this.y)
            if (
                leftPawn &&
                leftPawn.type === type.pawn &&
                this.game.enPassant.x === this.x - 1
            ) {
                this.legalMoves[
                    posString(this.game.enPassant.x, this.game.enPassant.y)
                ] = false
            }
            const rightPawn = this.hasPiece(this.x + 1, this.y)
            if (
                rightPawn &&
                rightPawn.type === type.pawn &&
                this.game.enPassant.x === this.x + 1
            ) {
                this.legalMoves[
                    posString(this.game.enPassant.x, this.game.enPassant.y)
                ] = false
            }
        } else if (
            this.y === 4 &&
            this.color === color.black &&
            this.game.enPassant.y === 5
        ) {
            const leftPawn = this.hasPiece(this.x - 1, this.y)
            if (
                leftPawn &&
                leftPawn.type === type.pawn &&
                this.game.enPassant.x === this.x - 1
            ) {
                this.legalMoves[
                    posString(this.game.enPassant.x, this.game.enPassant.y)
                ] = false
            }
            const rightPawn = this.hasPiece(this.x + 1, this.y)
            if (
                rightPawn &&
                rightPawn.type === type.pawn &&
                this.game.enPassant.x === this.x + 1
            ) {
                this.legalMoves[
                    posString(this.game.enPassant.x, this.game.enPassant.y)
                ] = false
            }
        }
    }
    createRookMoves() {
        const directions = [
            {
                x: 1,
                y: 0,
            },
            {
                x: -1,
                y: 0,
            },
            {
                x: 0,
                y: 1,
            },
            {
                x: 0,
                y: -1,
            },
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
        const directions = [
            {
                x: 2,
                y: 1,
            },
            {
                x: 2,
                y: -1,
            },
            {
                x: -2,
                y: 1,
            },
            {
                x: -2,
                y: -1,
            },
            {
                x: 1,
                y: 2,
            },
            {
                x: 1,
                y: -2,
            },
            {
                x: -1,
                y: 2,
            },
            {
                x: -1,
                y: -2,
            },
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
        const directions = [
            {
                x: 1,
                y: 1,
            },
            {
                x: 1,
                y: -1,
            },
            {
                x: -1,
                y: 1,
            },
            {
                x: -1,
                y: -1,
            },
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
        const directions = [
            {
                x: 1,
                y: 1,
            },
            {
                x: 1,
                y: -1,
            },
            {
                x: -1,
                y: 1,
            },
            {
                x: -1,
                y: -1,
            },
            {
                x: 1,
                y: 0,
            },
            {
                x: -1,
                y: 0,
            },
            {
                x: 0,
                y: 1,
            },
            {
                x: 0,
                y: -1,
            },
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
            if (!this.game.isCheck(this.color)) {
                if (this.color === color.black) {
                    if (
                        this.hasPiece(5, 0) === undefined &&
                        this.hasPiece(6, 0) === undefined
                    ) {
                        if (
                            !this.game.isAttack(
                                5,
                                0,
                                oppositeColor(this.color)
                            ) &&
                            !this.game.isAttack(6, 0, oppositeColor(this.color))
                        ) {
                            const rook = this.hasPiece(7, 0)
                            if (rook != undefined && rook.hasMoved === false) {
                                this.legalMoves[posString(6, 0)] = false
                            }
                        }
                    }
                    if (
                        this.hasPiece(1, 0) === undefined &&
                        this.hasPiece(2, 0) === undefined &&
                        this.hasPiece(3, 0) === undefined
                    ) {
                        if (
                            !this.game.isAttack(
                                2,
                                0,
                                oppositeColor(this.color)
                            ) &&
                            !this.game.isAttack(3, 0, oppositeColor(this.color))
                        ) {
                            // if (!this.game.isAttack(1, 0, oppositeColor(this.color)) && !this.game.isAttack(2, 0, oppositeColor(this.color)) && !this.game.isAttack(3, 0, oppositeColor(this.color))) {
                            const rook = this.hasPiece(0, 0)
                            if (rook != undefined && rook.hasMoved === false) {
                                this.legalMoves[posString(2, 0)] = false
                            }
                        }
                    }
                } else if (this.color === color.white) {
                    if (
                        this.hasPiece(5, 7) === undefined &&
                        this.hasPiece(6, 7) === undefined
                    ) {
                        if (
                            !this.game.isAttack(
                                5,
                                7,
                                oppositeColor(this.color)
                            ) &&
                            !this.game.isAttack(6, 7, oppositeColor(this.color))
                        ) {
                            const rook = this.hasPiece(7, 7)
                            if (rook != undefined && rook.hasMoved === false) {
                                this.legalMoves[posString(6, 7)] = false
                            }
                        }
                    }
                    if (
                        this.hasPiece(1, 7) === undefined &&
                        this.hasPiece(2, 7) === undefined &&
                        this.hasPiece(3, 7) === undefined
                    ) {
                        if (
                            !this.game.isAttack(
                                2,
                                7,
                                oppositeColor(this.color)
                            ) &&
                            !this.game.isAttack(3, 7, oppositeColor(this.color))
                        ) {
                            // if (!this.game.isAttack(1, 7, oppositeColor(this.color)) && !this.game.isAttack(2, 7, oppositeColor(this.color)) && !this.game.isAttack(3, 7, oppositeColor(this.color))) {
                            const rook = this.hasPiece(0, 7)
                            if (rook != undefined && rook.hasMoved === false) {
                                this.legalMoves[posString(2, 7)] = false
                            }
                        }
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

export function posString(x, y) {
    return `x${x}y${y}`
}

export function oppositeColor(opColor) {
    return opColor === color.white ? color.black : color.white
}
