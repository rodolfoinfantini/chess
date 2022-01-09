import { puzzleDB } from './small-puzzleDB.js'

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

let finished = false

let initializing = false

function init() {
    if (initializing) {
        return new Promise((resolve, reject) => {
            setInterval(() => {
                if (finished) {
                    resolve()
                }
            })
        })
    }
    if (puzzles.length === 0) {
        initializing = true
        const splitted = puzzleDB.split('\n')
        for (let i = 0; i < splitted.length; i++) {
            const split = splitted[i].split(',')
            const fen = split[1]
            const moves = split[2]
            const rating = split[3]
            const themes = split[7]
            puzzles.push(new Puzzle(fen, moves, rating, themes))
        }
        finished = true
        initializing = false
    }
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

export async function randomPuzzle(minRating = 0, maxRating = 0, themes = '') {
    await init()
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
            found: puzzles.length,
        }
    }

    const filtered = puzzles.filter((puzzle) => {
        return (
            (puzzle.rating >= minRating || minRating === 0) &&
            (puzzle.rating <= maxRating || maxRating === 0) &&
            (hasTheme(puzzle, themes) || themes.length === 0)
        )
    })

    if (filtered.length === 0) {
        return new Error('No puzzles found')
    }

    const randomPuzzle = filtered[Math.floor(Math.random() * filtered.length)]
    return {
        puzzle: randomPuzzle,
        found: filtered.length,
    }
}

setTimeout(init, 30000)
