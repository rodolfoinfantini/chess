'use strict'

import {
    Game
} from './modules/game.js'

import {
    gamemode,
    color
} from './modules/constants.js'
import {
    play
} from './modules/sound.js'

const socket = io('/')

let playerColor

socket.on('color', data => {
    playerColor = data
    if (playerColor === 'black') {
        board.classList.add('flipped')
    } else {
        board.classList.remove('flipped')
    }
})

const urlParams = new URLSearchParams(window.location.search)


function createBoard(appendTo = false) {
    const board = document.createElement('board')
    const coordsRows = document.createElement('coords')
    const coordsColumns = document.createElement('coords')
    coordsRows.classList.add('rows')
    coordsColumns.classList.add('columns')
    const letters = ['', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
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

    //flip button
    const flipBtn = document.createElement('button')
    flipBtn.textContent = 'Flip board'
    flipBtn.classList.add('flip-btn')
    flipBtn.onclick = () => {
        board.classList.toggle('flipped')
    }

    //auto flip checkmark
    const label = document.createElement('label')
    label.textContent = 'Auto flip'
    label.classList.add('auto-flip')
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.checked = false
    label.appendChild(input)

    //stop
    let stopBtn = document.createElement('button')
    stopBtn.classList.add('stop-btn')

    if (urlParams.has('room')) {
        stopBtn.textContent = 'Resign'
        stopBtn.onclick = () => {
            socket.emit('resign')
        }
    } else {
        stopBtn.textContent = 'Stop'
        stopBtn.onclick = () => {
            if (game) game.startPos()
            gamemodeDiv.parentElement.classList.remove('hidden')
        }
    }

    //playing as
    const playingAs = document.createElement('div')
    playingAs.classList.add('playing-as')

    //color to move
    const colorToMove = document.createElement('div')
    colorToMove.classList.add('color-to-move')




    options.appendChild(flipBtn)
    if (!urlParams.has('room')) options.appendChild(label)
    options.appendChild(stopBtn)
    options.appendChild(playingAs)
    options.appendChild(colorToMove)

    board.appendChild(options)

    if (appendTo) {
        appendTo.appendChild(board)
    }
    return board
}

const gamemodeDiv = document.querySelector('div.play .gamemode')

const createRoomButton = document.querySelector('button.create-room')

const waitingDiv = document.createElement('div')
waitingDiv.classList.add('waiting')
waitingDiv.textContent = `Waiting for opponent...`
const link = document.createElement('a')
link.href = location.href
link.textContent = link.href
link.target = '_blank'
waitingDiv.appendChild(link)

const copyLinkBtn = document.createElement('button')
copyLinkBtn.textContent = 'Copy link'
copyLinkBtn.onclick = () => {
    navigator.clipboard.writeText(link.href)
        .then(() => {
            copyLinkBtn.textContent = 'Copied!'
            setTimeout(() => {
                copyLinkBtn.textContent = 'Copy link'
            }, 1000)
        })
        .catch(() => {
            copyLinkBtn.textContent = 'Error!'
            setTimeout(() => {
                copyLinkBtn.textContent = 'Copy link'
            }, 1000)
        })
}
waitingDiv.appendChild(copyLinkBtn)

const shareData = {
    title: 'Chess!',
    text: 'Play chess with me!',
    url: location.href
}

const shareBtn = document.createElement('button')
shareBtn.textContent = 'Share'
shareBtn.onclick = () => {
    navigator.share(shareData)
        .then(() => {
            shareBtn.textContent = 'Shared!'
            setTimeout(() => {
                shareBtn.textContent = 'Share'
            }, 1000)
        })
        .catch(() => {
            shareBtn.textContent = 'Error!'
            setTimeout(() => {
                shareBtn.textContent = 'Share'
            }, 1000)
        })
}
waitingDiv.appendChild(shareBtn)

if (urlParams.has('room')) {
    gamemodeDiv.parentElement.classList.add('hidden')
    socket.on('not-found', () => {
        alert('not found')
        window.location.search = ''
    })
    socket.emit('join-room', urlParams.get('room'))
    document.body.appendChild(waitingDiv)
}


createRoomButton.onclick = () => {
    socket.on('create-room', roomId => {
        const urlParams = new URLSearchParams(window.location.search)
        urlParams.set('room', roomId)
        window.location.search = urlParams.toString()
    })
    socket.emit('create-room')
}

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

function removeAllTiles() {
    if (board) {
        board.querySelectorAll('.tile').forEach(tile => {
            tile.remove()
        })
    }
}

playBtn.onclick = () => {
    gamemodeDiv.parentElement.classList.add('hidden')
    const selectedBtn = gamemodeDiv.querySelector('.toggle.selected')
    const mode = selectedBtn.getAttribute('data-mode')
    if (game) game.stop()
    game = Game(gamemode[mode] || gamemode.playerVsPlayer, color.white, board)
    placeholderGame.stop()
    placeholderBoard.remove()
    document.body.appendChild(board)
    game.start()
}

socket.on('reset', () => {
    location.search = ''
})

socket.on('player-disconnected', () => {
    alert('Opponent disconnected')
})

socket.on('resign', (color) => {
    if (game) game.resign(color)
})

socket.on('start', () => {
    waitingDiv.remove()
    placeholderGame.stop()
    placeholderBoard.remove()
    removeAllTiles()
    if (game) game.stop()
    game = Game(gamemode.multiplayer, playerColor, board, socket)
    document.body.appendChild(board)
    game.start()
})

socket.on('move', ({
    from,
    to
}) => {
    game.movePiece(from, to)
})