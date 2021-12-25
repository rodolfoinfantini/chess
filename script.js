'use strict'

import {
    Game
} from './modules/game.js'

import {
    gamemode,
    color
} from './modules/constants.js'

function createBoard(appendTo) {
    const board = document.createElement('board')
    const coordsRows = document.createElement('coords')
    const coordsColumns = document.createElement('coords')
    coordsRows.classList.add('rows')
    coordsColumns.classList.add('columns')
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    for (let i = 1; i <= 8; i++) {
        const coord = document.createElement('coord')
        coord.textContent = i
        coordsRows.appendChild(coord)

        const coord2 = document.createElement('coord')
        coord2.textContent = letters[i]
        coordsColumns.appendChild(coord2)
    }
    board.appendChild(coordsRows)
    board.appendChild(coordsColumns)

    const options = document.createElement('div')
    options.classList.add('board-options')

    const flipBtn = document.createElement('button')
    flipBtn.textContent = 'Flip board'
    flipBtn.classList.add('flip-btn')
    flipBtn.onclick = () => {
        board.classList.toggle('flipped')
    }

    options.appendChild(flipBtn)

    board.appendChild(options)

    if (appendTo) {
        appendTo.appendChild(board)
    }
    return board
}

const gamemodeDiv = document.querySelector('div.play .gamemode')

gamemodeDiv.querySelectorAll('.toggle').forEach(el => {
    el.onclick = () => {
        gamemodeDiv.querySelectorAll('.selected').forEach(selected => {
            selected.classList.remove('selected')
        })
        el.classList.add('selected')
    }
})

const placeholderBoard = createBoard(document.body)
const placeholderGame = Game(gamemode.playerVsPlayer, color.white, placeholderBoard)

const playBtn = document.querySelector('div.play button.play-btn')

const board = createBoard()
let game

playBtn.onclick = () => {
    gamemodeDiv.parentElement.classList.add('hidden')
    const selectedBtn = gamemodeDiv.querySelector('.toggle.selected')
    const mode = selectedBtn.getAttribute('data-mode')
    game = Game(gamemode[mode] || gamemode.playerVsPlayer, color.white, board)
    placeholderGame.stop()
    placeholderBoard.remove()
    document.body.appendChild(board)
    game.start()
}