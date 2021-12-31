'use strict'

import {
    Game
} from './modules/game.js'

import {
    gamemode,
    color
} from './modules/constants.js'

import {
    createBoard
} from './modules/board.js'

const signInBtn = document.querySelector('header a.sign-in')
const signOutBtn = document.querySelector('header button.sign-out')
if (localStorage.getItem('token') && localStorage.getItem('username')) {
    signInBtn.classList.add('hidden')

    signOutBtn.onclick = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('username')
        location.reload()
    }

    signOutBtn.textContent = `${localStorage.getItem('username')} | Sign out`

    signOutBtn.classList.remove('hidden')
}

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
    socket.emit('join-room', {
        roomId: urlParams.get('room'),
        token: localStorage.getItem('token')
    })
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

function createOptions(...args) {
    const options = []
    args.forEach(arg => {
        const option = document.createElement('option')
        if (typeof option === 'object') {
            option.textContent = arg.text
            option.value = arg.value
        } else {
            option.textContent = arg
            option.value = arg
        }
        options.push(option)
    })
    return options
}

const times = {
    t30: 60,
    t31: 75,
    t32: 90,
    t33: 105,
    t34: 120,
    t35: 135,
    t36: 150,
    t37: 165
}

function indexToMinutes(i) {
    i = +i
    if (i === 0) return 0
    if (i === 1) return 0.25
    if (i === 2) return 0.5
    if (i === 3) return 0.75
    if (i === 4) return 1
    if (i === 5) return 1.5
    if (i >= 6 && i <= 24) return i - 4
    if (i === 25) return 25
    if (i === 26) return 30
    if (i === 27) return 35
    if (i === 28) return 40
    if (i === 29) return 45
    if (i >= 30 && i <= 37) return times['t' + i]
    return 180
}


function createTimeSelector() {
    const timeDiv = document.createElement('div')
    timeDiv.classList.add('time-selector')
    const timeInput = document.createElement('input')
    timeInput.type = 'range'
    timeInput.min = '1'
    timeInput.max = '38'
    timeInput.value = '14'
    timeInput.step = '1'
    /* const timeInput = document.createElement('input')
    timeInput.type = 'number'
    timeInput.min = '0'
    timeInput.max = '3600'
    timeInput.value = '600' */

    const timeLabel = document.createElement('label')
    const span = document.createElement('span')
    const bold = document.createElement('b')
    span.textContent = 'Minutes per side:'
    span.appendChild(bold)
    bold.textContent = 10
    timeLabel.appendChild(span)
    timeLabel.appendChild(timeInput)

    timeInput.oninput = () => {
        bold.textContent = indexToMinutes(timeInput.value)
    }

    const ratedSelect = document.createElement('select')
    const ratedOption = document.createElement('option')
    ratedOption.value = 'rated'
    ratedOption.textContent = 'Rated'
    ratedOption.selected = true
    const casualOption = document.createElement('option')
    casualOption.value = 'casual'
    casualOption.textContent = 'Casual'
    ratedSelect.appendChild(ratedOption)
    ratedSelect.appendChild(casualOption)

    const ratedLabel = document.createElement('label')
    ratedLabel.textContent = 'Game mode'
    ratedLabel.appendChild(ratedSelect)

    const createBtn = document.createElement('button')
    createBtn.textContent = 'Create room'
    createBtn.onclick = () => {
        if (creating) return
        creating = true
        socket.emit('create-room', {
            time: indexToMinutes(timeInput.value) * 60,
            rated: ratedSelect.value === 'rated'
        })
    }

    const cancelBtn = document.createElement('button')
    cancelBtn.textContent = 'Cancel'
    cancelBtn.onclick = () => {
        timeDiv.parentElement.removeChild(timeDiv)
    }

    timeDiv.appendChild(timeLabel)
    timeDiv.appendChild(ratedLabel)
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

socket.on('start', ({
    gameTime,
    players
}) => {
    waitingDiv.remove()
    placeholderGame.stop()
    placeholderBoard.remove()
    removeAllTiles()
    if (game) game.stop()
    game = Game(gamemode.multiplayer, playerColor, board, socket, +gameTime)
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