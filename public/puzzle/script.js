import {
    PuzzleGame
} from '../modules/game.js'

import {
    createBoard
} from '../modules/board.js'

const searchParams = new URLSearchParams(location.search)

const form = document.querySelector('.filters form')
const minRating = form.querySelector('input.min')
const maxRating = form.querySelector('input.max')
const toggleBtns = form.querySelectorAll('.toggle')

if (searchParams.has('minRating')) {
    minRating.value = searchParams.get('minRating')
}
if (searchParams.has('maxRating')) {
    maxRating.value = searchParams.get('maxRating')
}
if (searchParams.has('themes')) {
    toggleBtns.forEach(btn => {
        const theme = btn.getAttribute('data-theme')
        if (searchParams.get('themes').includes(theme)) {
            btn.classList.add('selected')
        }
    })
}

toggleBtns.forEach(btn => {
    btn.onclick = () => {
        btn.classList.toggle('selected')
    }
})

form.onsubmit = (e) => {
    e.preventDefault()

    const selectedButtons = form.querySelectorAll('.toggle.selected')

    let themeStr = ''

    if (selectedButtons.length > 0) {
        selectedButtons.forEach((button, i) => {
            themeStr += `${button.getAttribute('data-theme')}`
            if (i !== selectedButtons.length - 1) {
                themeStr += ','
            }
        })
    }

    location.search = `?minRating=${minRating.value}&maxRating=${maxRating.value}&themes=${themeStr}`
}



const board = createBoard(document.body)
let game


function solved() {
    alert('Congratulations! You solved the puzzle!')
    if (game) game.stop()
    generatePuzzle()
}


async function generatePuzzle() {

    const puzzle = await getRandomPuzzle()

    if (puzzle.error) {
        alert(puzzle.error)
        return
    }

    game = PuzzleGame(puzzle.puzzle, board, solved)

    game.start()
}

async function getRandomPuzzle() {
    const response = await fetch(`${location.protocol}//${location.host}/puzzle/random/${location.search}`)
    const puzzle = await response.json()
    return puzzle
}

generatePuzzle()