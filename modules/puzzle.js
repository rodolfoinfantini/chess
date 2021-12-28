import {
    puzzleDB
} from './puzzleDB.js'

/*
`00008,r6k/pp2r2p/4Rp1Q/3p4/8/1N1P2R1/PqP2bPP/7K b - - 0 24,f2g3 e6e7 b2b1 b3c1 b1c1 h6c1,2007,75,91,277,crushing hangingPiece long middlegame,https://lichess.org/787zsVup/black#48
0000D,5rk1/1p3ppp/pq3b2/8/8/1P1Q1N2/P4PPP/3R2K1 w - - 2 27,d3d6 f8d8 d6d8 f6d8,1617,75,97,5136,advantage endgame short,https://lichess.org/F8M8OS71#53
0009B,r2qr1k1/b1p2ppp/pp4n1/P1P1p3/4P1n1/B2P2Pb/3NBP1P/RN1QR1K1 b - - 1 16,b6c5 e2g4 h3g4 d1g4,1111,75,85,482,advantage middlegame short,https://lichess.org/4MWQCxQ6/black#32
000aY,r4rk1/pp3ppp/2n1b3/q1pp2B1/8/P1Q2NP1/1PP1PP1P/2KR3R w - - 0 15,g5e7 a5c3 b2c3 c6e7,1415,74,91,278,advantage master middlegame short,https://lichess.org/iihZGl6t#29
000h7,3q1rk1/1pp3pp/5p1P/4pPP1/rb1pP3/3P1N2/b1P1B3/2QK2RR b - - 7 26,d8a8 g5g6 h7g6 h6g7,2349,86,83,223,advancedPawn crushing kingsideAttack middlegame quietMove short,https://lichess.org/FLmpZbTm/black#52
000tp,4r3/5pk1/1p3np1/3p3p/2qQ4/P4N1P/1P3RP1/7K w - - 6 34,d4b6 f6e4 h1g1 e4f2,2038,76,80,86,crushing endgame short trappedPiece,https://lichess.org/GeXqsW90#67
00143,r2q1rk1/5ppp/1np5/p1b5/2p1B3/P7/1P3PPP/R1BQ1RK1 b - - 1 17,d8f6 d1h5 h7h6 h5c5,1778,75,92,1067,advantage middlegame short,https://lichess.org/jcuxlI63/black#34
0018S,2kr3r/pp3p2/4p2p/1N1p2p1/3Q4/1P1P4/2q2PPP/5RK1 b - - 1 20,b7b6 d4a1 a7a5 f1c1,2531,83,93,688,advantage endgame pin short,https://lichess.org/H1ARO2GL/black#40
001Wz,4r1k1/5ppp/r1p5/p1n1RP2/8/2P2N1P/2P3P1/3R2K1 b - - 0 21,e8e5 d1d8 e5e8 d8e8,1128,80,87,45,backRankMate endgame mate mateIn2 short,https://lichess.org/84RH3LaP/black#42
001om,5r1k/pp4pp/5p2/1BbQp1r1/6K1/7P/1PP3P1/3R3R w - - 2 26,g4h4 c5f2 g2g3 f2g3,1040,83,100,171,mate mateIn2 middlegame short,https://lichess.org/VWOIWtIh#51
001u3,2r3k1/p1q2pp1/Q3p2p/b1Np4/2nP1P2/4P1P1/5K1P/2B1N3 b - - 3 33,c7b6 a6c8 g8h7 c8b7,2165,82,52,64,advantage hangingPiece middlegame short,https://lichess.org/BBn6ipaK/black#66
001wr,r4rk1/p3ppbp/Pp1q1np1/3PpbB1/2B5/2N5/1PPQ1PPP/3RR1K1 w - - 4 18,f2f3 d6c5 g1h1 c5c4,1116,198,100,10,advantage fork master masterVsMaster middlegame short,https://lichess.org/KnJ2mojX#35
001xl,8/4R1k1/p5pp/3B4/5q2/8/5P1P/6K1 b - - 5 40,g7f6 e7f7 f6e5 f7f4,1311,74,95,2441,advantage endgame master masterVsMaster short skewer superGM,https://lichess.org/bEQkfPQD/black#80
00206,r3kb1r/pppqpn1p/5p2/3p1bpQ/2PP4/4P1B1/PP3PPP/RN2KB1R w KQkq - 1 11,b1c3 f5g4 h5g4 d7g4,1546,75,96,4713,advantage opening short trappedPiece,https://lichess.org/MbJRo6PT#21
002Cw,r7/2p2r1k/p2p1q1p/Pp1P4/1P2P3/2PQ4/6R1/R5K1 b - - 2 28,f7g7 e4e5 f6g6 g2g6,1132,78,98,493,crushing discoveredAttack endgame short,https://lichess.org/lxiSa85s/black#56
*/

class Puzzle {
    fen
    moves
    rating
    themes
    constructor(fen, moves, rating, themes) {
        this.fen = fen
        this.moves = moves.split(' ')
        this.rating = rating
        this.themes = themes.split(' ')
    }
}

class Error {
    error
    constructor(error) {
        this.error = error
    }
}

const puzzles = []

for (let i = 0; i < puzzleDB.length; i++) {
    const split = puzzleDB[i].split(',')
    const fen = split[1]
    const moves = split[2]
    const rating = split[3]
    const themes = split[7]
    puzzles.push(new Puzzle(fen, moves, rating, themes))
}


function hasTheme(puzzle, themes) {
    let themeNumber = 0
    for (let i = 0; i < themes.length; i++) {
        if (puzzle.themes.includes(themes[i])) {
            themeNumber++
        }
    }
    return themeNumber === themes.length
}

export function randomPuzzle(minRating = 0, maxRating = 0, themes = '') {
    themes = themes.trim()
    if (themes.length > 0) {
        themes = themes.split(',')
    }

    minRating = +minRating
    maxRating = +maxRating

    if (isNaN(minRating)) {
        return new Error('minRating must be a number')
    }
    if (isNaN(maxRating)) {
        return new Error('maxRating must be a number')
    }

    if (maxRating < minRating) {
        return new Error('maxRating must be greater than minRating')
    }

    if (maxRating === 0 && minRating === 0 && themes.length === 0) {
        const randomPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)]
        return {
            puzzle: randomPuzzle,
            found: puzzles.length
        }
    }

    const filtered = puzzles.filter(puzzle => {
        return (puzzle.rating >= minRating || minRating === 0) && (puzzle.rating <= maxRating || maxRating === 0) && (hasTheme(puzzle, themes) || themes.length === 0)
    })

    if (filtered.length === 0) {
        return new Error('No puzzles found')
    }

    const randomPuzzle = filtered[Math.floor(Math.random() * filtered.length)]
    return {
        puzzle: randomPuzzle,
        found: filtered.length
    }
}