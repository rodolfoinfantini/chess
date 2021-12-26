import {
    type,
    color,
    moveNumber
} from './constants.js'

class Position {
    type
    color
    x
    y
    constructor(type, color, str) {
        this.type = type
        this.color = color
        const strSplit = str.split('')
        this.x = +moveNumber[`x${strSplit[0]}`]
        this.y = +moveNumber[`y${strSplit[1]}`]
    }
}

const positions = {
    start: [
        new Position(type.rook, color.black, 'a8'),
        new Position(type.knight, color.black, 'b8'),
        new Position(type.bishop, color.black, 'c8'),
        new Position(type.queen, color.black, 'd8'),
        new Position(type.king, color.black, 'e8'),
        new Position(type.bishop, color.black, 'f8'),
        new Position(type.knight, color.black, 'g8'),

        new Position(type.rook, color.black, 'h8'),
        new Position(type.pawn, color.black, 'a7'),
        new Position(type.pawn, color.black, 'b7'),
        new Position(type.pawn, color.black, 'c7'),
        new Position(type.pawn, color.black, 'd7'),
        new Position(type.pawn, color.black, 'e7'),
        new Position(type.pawn, color.black, 'f7'),
        new Position(type.pawn, color.black, 'g7'),
        new Position(type.pawn, color.black, 'h7'),

        new Position(type.pawn, color.white, 'a2'),
        new Position(type.pawn, color.white, 'b2'),
        new Position(type.pawn, color.white, 'c2'),
        new Position(type.pawn, color.white, 'd2'),
        new Position(type.pawn, color.white, 'e2'),
        new Position(type.pawn, color.white, 'f2'),
        new Position(type.pawn, color.white, 'g2'),
        new Position(type.pawn, color.white, 'h2'),

        new Position(type.rook, color.white, 'a1'),
        new Position(type.knight, color.white, 'b1'),
        new Position(type.bishop, color.white, 'c1'),
        new Position(type.queen, color.white, 'd1'),
        new Position(type.king, color.white, 'e1'),
        new Position(type.bishop, color.white, 'f1'),
        new Position(type.knight, color.white, 'g1'),
        new Position(type.rook, color.white, 'h1')
    ],
    test: [{
            type: type.king,
            color: color.black,
            x: 0,
            y: 0
        },
        {
            type: type.king,
            color: color.white,
            x: 0,
            y: 2
        },
        {
            type: type.queen,
            color: color.white,
            x: 7,
            y: 2
        },
    ]
}

export const startPosition = positions.start