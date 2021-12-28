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

import {
    createBoard
} from './modules/board.js'

const socket = io('/')

let playerColor

const urlParams = new URLSearchParams(window.location.search)
const gamemodeDiv = document.querySelector('div.play .gamemode')

const board = createBoard(undefined, () => {
    if (game) game.startPos()
    gamemodeDiv.parentElement.classList.remove('hidden')
}, socket)


socket.on('color', data => {
    playerColor = data
    if (playerColor === 'black') {
        board.classList.add('flipped')
    } else {
        board.classList.remove('flipped')
    }
})


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

let creating = false


createRoomButton.onclick = () => {
    socket.on('create-room', roomId => {
        if ((roomId + '').startsWith('error')) {
            creating = false
            const error = (roomId + '').split(':')[1]
            alert(error)
            return
        }
        const urlParams = new URLSearchParams(window.location.search)
        urlParams.set('room', roomId)
        window.location.search = urlParams.toString()
    })
    document.body.appendChild(createTimeSelector())
}

function createTimeSelector() {
    const timeDiv = document.createElement('div')
    timeDiv.classList.add('time-selector')
    const timeInput = document.createElement('input')
    timeInput.type = 'number'
    timeInput.min = '0'
    timeInput.max = '3600'
    timeInput.value = '600'

    const timeLabel = document.createElement('label')
    timeLabel.textContent = 'Game time (seconds)'
    timeLabel.appendChild(timeInput)

    const createBtn = document.createElement('button')
    createBtn.textContent = 'Create room'
    createBtn.onclick = () => {
        if (creating) return
        creating = true
        socket.emit('create-room', timeInput.value)
    }

    const cancelBtn = document.createElement('button')
    cancelBtn.textContent = 'Cancel'
    cancelBtn.onclick = () => {
        timeDiv.parentElement.removeChild(timeDiv)
    }

    timeDiv.appendChild(timeLabel)
    timeDiv.appendChild(createBtn)
    timeDiv.appendChild(cancelBtn)

    return timeDiv
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

socket.on('resign', (color) => {
    if (game) game.resign(color)
})

socket.on('start', (time) => {
    waitingDiv.remove()
    placeholderGame.stop()
    placeholderBoard.remove()
    removeAllTiles()
    if (game) game.stop()
    game = Game(gamemode.multiplayer, playerColor, board, socket, +time)
    document.body.appendChild(board)
    game.start()
})

socket.on('invalid-move', () => {
    alert('invalid')
})

socket.on('move', ({
    from,
    to
}) => {
    game.movePiece(from, to)
})