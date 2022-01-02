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

if (localStorage.getItem('token') && localStorage.getItem('username')) {
    const signOutBtn = document.querySelector('header button.sign-out')
    document.querySelector('header a.sign-in').classList.add('hidden')

    signOutBtn.onclick = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('username')
        location.reload()
    }

    signOutBtn.textContent = `${localStorage.getItem('username')} | Sign out`

    signOutBtn.classList.remove('hidden')
}

const socket = io('/')

let playerColor = color.white

const urlParams = new URLSearchParams(window.location.search)
const gamemodeDiv = document.querySelector('div.play .gamemode')

const board = createBoard(undefined, () => {
    if (game) game.startPos()
    gamemodeDiv.parentElement.parentElement.classList.remove('hidden')
}, socket)

const placeholderBoard = createBoard(document.body)


socket.on('color', data => {
    playerColor = data
    if (playerColor === 'black') {
        board.classList.add('flipped')
        if (placeholderBoard) placeholderBoard.classList.add('flipped')
    } else {
        board.classList.remove('flipped')
        if (placeholderBoard) placeholderBoard.classList.remove('flipped')
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
    gamemodeDiv.parentElement.parentElement.classList.add('hidden')
    socket.on('not-found', () => {
        alert('not found')
        window.location.search = ''
    })
    socket.on('join-room', data => {
        if (data.startsWith('error:')) {
            alert(data.split(':')[1])
            window.location.search = ''
            return
        }
    })
    socket.emit('join-room', {
        roomId: urlParams.get('room'),
        token: localStorage.getItem('token'),
        color: sessionStorage.getItem('color') || "white"
    })
    sessionStorage.removeItem('color')
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
    const createGameDiv = document.createElement('div')
    createGameDiv.classList.add('create-game')

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

    let isRated = true

    const btns = document.createElement('div')
    btns.classList.add('btns')
    const ratedButton = document.createElement('div')
    ratedButton.classList.add('rated-btn', 'toggle', 'selected')
    ratedButton.textContent = 'Rated'
    const casualButton = document.createElement('div')
    casualButton.classList.add('casual-btn', 'toggle')
    casualButton.textContent = 'Casual'

    ratedButton.onclick = () => {
        isRated = true
        ratedButton.classList.add('selected')
        casualButton.classList.remove('selected')
    }
    casualButton.onclick = () => {
        isRated = false
        ratedButton.classList.remove('selected')
        casualButton.classList.add('selected')
    }

    btns.appendChild(ratedButton)
    btns.appendChild(casualButton)
    /* const ratedSelect = document.createElement('select')
    const ratedOption = document.createElement('option')
    ratedOption.value = 'rated'
    ratedOption.textContent = 'Rated'
    ratedOption.selected = true
    const casualOption = document.createElement('option')
    casualOption.value = 'casual'
    casualOption.textContent = 'Casual' */
    // ratedSelect.appendChild(ratedOption)
    // ratedSelect.appendChild(casualOption)

    const ratedLabel = document.createElement('label')
    ratedLabel.textContent = 'Game mode'
    ratedLabel.appendChild(btns)
    ratedLabel.classList.add('game-mode')
    // ratedLabel.appendChild(ratedSelect)

    const colorSelection = document.createElement('div')
    colorSelection.classList.add('color-selection')

    const blackSelection = document.createElement('button')
    blackSelection.classList.add('color-btn', 'black')
    blackSelection.onclick = () => createRoom('black')

    const whiteSelection = document.createElement('button')
    whiteSelection.classList.add('color-btn', 'white')
    whiteSelection.onclick = () => createRoom('white')

    const randomSelection = document.createElement('button')
    randomSelection.classList.add('color-btn', 'random')
    randomSelection.onclick = () => createRoom('random')

    colorSelection.appendChild(blackSelection)
    colorSelection.appendChild(randomSelection)
    colorSelection.appendChild(whiteSelection)

    function createRoom(color) {
        if (creating) return
        creating = true
        if (color === 'random') {
            color = Math.random() < 0.5 ? 'black' : 'white'
        }
        sessionStorage.setItem('color', color)
        socket.emit('create-room', {
            time: indexToMinutes(timeInput.value) * 60,
            rated: isRated
        })
    }

    /* const createBtn = document.createElement('button')
    createBtn.textContent = 'Create room'
    createBtn.onclick = () => {
        if (creating) return
        creating = true
        socket.emit('create-room', {
            time: indexToMinutes(timeInput.value) * 60,
            rated: isRated
        })
    } */

    const cancelBtn = document.createElement('button')
    cancelBtn.textContent = 'Cancel'
    cancelBtn.onclick = () => {
        createGameDiv.remove()
    }

    timeDiv.appendChild(timeLabel)
    timeDiv.appendChild(ratedLabel)
    // timeDiv.appendChild(createBtn)
    timeDiv.appendChild(colorSelection)
    timeDiv.appendChild(cancelBtn)

    createGameDiv.appendChild(timeDiv)
    return createGameDiv
}

gamemodeDiv.querySelectorAll('.toggle').forEach(el => {
    el.onclick = () => {
        gamemodeDiv.querySelectorAll('.selected').forEach(selected => {
            selected.classList.remove('selected')
        })
        el.classList.add('selected')
    }
})

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
    gamemodeDiv.parentElement.parentElement.classList.add('hidden')
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

socket.on('spectator', ({
    fen,
    gameTime
}) => {
    waitingDiv.remove()
    placeholderGame.stop()
    placeholderBoard.remove()
    removeAllTiles()
    if (game) game.stop()
    game = Game(gamemode.spectator, playerColor, board, socket, +gameTime, {
        fen
    })
    document.body.appendChild(board)
    game.start()
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