'use strict'

import { Game } from './modules/game.js'

import { gamemode, color } from './modules/constants.js'

import { createBoard } from './modules/board.js'

import { ping, getColorForPing } from './modules/ping.js'

import { serverDelay } from './modules/serverDelay.js'

const socket = io('/')

const pingConfig = {
    good: {
        color: '#00bb00',
        min: 0,
        max: 170,
    },
    medium: {
        color: '#ffcc00',
        min: 171,
        max: 400,
    },
    bad: {
        color: '#cc0000',
        min: 401,
        max: 800,
    },
    veryBad: {
        color: '#770000',
        min: 801,
        max: Infinity,
    },
}

ping.config(document.querySelector('.ping-wrapper .ping-value'), 5000, pingConfig)
serverDelay.config(socket, document.querySelector('.ping-wrapper .server-value'), pingConfig)

socket.on('sign-out', () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    location.href = '/login'
})

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

let playerColor = color.white

const urlParams = new URLSearchParams(window.location.search)
const gamemodeDiv = document.querySelector('div.play .gamemode')

const board = createBoard(
    undefined,
    () => {
        if (game) game.startPos()
        gamemodeDiv.parentElement.parentElement.classList.remove('hidden')
    },
    socket,
)

const placeholderBoard = createBoard(document.body)

socket.on('color', (data) => {
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
    navigator.clipboard
        .writeText(link.href)
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
    url: location.href,
}

const shareBtn = document.createElement('button')
shareBtn.textContent = 'Share'
shareBtn.onclick = () => {
    navigator
        .share(shareData)
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

if (urlParams.has('r')) {
    gamemodeDiv.parentElement.parentElement.classList.add('hidden')
    socket.on('not-found', () => {
        alert('not found')
        window.location.search = ''
    })
    socket.on('join-room', (data) => {
        if (data.startsWith('error:')) {
            alert(data.split(':')[1])
            window.location.search = ''
            return
        }
    })
    socket.emit('join-room', {
        roomId: urlParams.get('r'),
        token: localStorage.getItem('token'),
        color: sessionStorage.getItem('color') || 'white',
    })
    sessionStorage.removeItem('color')
    document.body.appendChild(waitingDiv)
}

let creating = false

createRoomButton.onclick = () => {
    socket.on('create-room', (roomId) => {
        if ((roomId + '').startsWith('error')) {
            creating = false
            const error = (roomId + '').split(':')[1]
            alert(error)
            return
        }
        const urlParams = new URLSearchParams(window.location.search)
        urlParams.set('r', roomId)
        window.location.search = urlParams.toString()
    })
    document.body.appendChild(createTimeSelector())
}

function createOptions(...args) {
    const options = []
    args.forEach((arg) => {
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
    t37: 165,
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
    timeInput.classList.add('range')
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

    let isPublic = true

    const visBtns = document.createElement('div')
    visBtns.classList.add('btns')
    const publicButton = document.createElement('div')
    publicButton.classList.add('public-btn', 'toggle', 'selected')
    publicButton.textContent = 'Public'
    const privateButton = document.createElement('div')
    privateButton.classList.add('private-btn', 'toggle')
    privateButton.textContent = 'Private'

    publicButton.onclick = () => {
        isPublic = true
        publicButton.classList.add('selected')
        privateButton.classList.remove('selected')
    }
    privateButton.onclick = () => {
        isPublic = false
        publicButton.classList.remove('selected')
        privateButton.classList.add('selected')
    }

    visBtns.appendChild(publicButton)
    visBtns.appendChild(privateButton)

    const visLabel = document.createElement('label')
    visLabel.textContent = 'Visibility'
    visLabel.appendChild(visBtns)
    visLabel.classList.add('visibility')

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
            rated: !!isRated,
            isPublic,
        })
    }

    const cancelBtn = document.createElement('button')
    cancelBtn.textContent = 'X'
    cancelBtn.classList.add('cancel-btn')
    cancelBtn.onclick = () => {
        createGameDiv.remove()
    }

    timeDiv.appendChild(timeLabel)
    timeDiv.appendChild(ratedLabel)
    timeDiv.appendChild(visLabel)
    timeDiv.appendChild(colorSelection)
    timeDiv.appendChild(cancelBtn)

    createGameDiv.appendChild(timeDiv)
    return createGameDiv
}

const placeholderGame = Game(gamemode.placeholder, color.white, placeholderBoard)

let game

function removeAllTiles() {
    if (board) {
        board.querySelectorAll('.tile').forEach((tile) => {
            tile.remove()
        })
    }
}

const skillTemplate = document.querySelector('#skill-level-template')
const skillDiv = document.importNode(skillTemplate.content.firstElementChild, true)
const skillLevelLabel = skillDiv.querySelector('label.skill')
const skillLevelInput = skillLevelLabel.children[1]
const skillTimeLabel = skillDiv.querySelector('label.move-time')
const skillTimeInput = skillTimeLabel.children[1]
const skillStartBtn = skillDiv.querySelector('button.start-btn')
const skillCloseBtn = skillDiv.querySelector('button.close-btn')
const skillColorBtns = skillDiv.querySelectorAll('.color-btn')

skillCloseBtn.onclick = () => {
    gamemodeDiv.querySelector('.toggle.selected').classList.remove('selected')
    skillDiv.remove()
}

skillLevelInput.oninput = () => {
    skillLevelLabel.children[0].textContent = `Skill level: ${skillLevelInput.value}`
}
skillTimeInput.oninput = () => {
    skillTimeLabel.children[0].textContent = `Thinking time: ${skillTimeInput.value}`
}

skillStartBtn.onclick = () => {
    play(true)
}

skillColorBtns.forEach((el) => {
    el.onclick = () => {
        let colorToPlay = el.classList[1]
        if (colorToPlay === 'random') {
            console.log('rand')
            colorToPlay = Math.random() < 0.5 ? color.black : color.white
        }
        play(true, colorToPlay)
    }
})

gamemodeDiv.querySelectorAll('.toggle').forEach((el) => {
    el.onclick = () => {
        gamemodeDiv.querySelectorAll('.selected').forEach((selected) => {
            selected.classList.remove('selected')
        })
        el.classList.add('selected')
        if (el.getAttribute('data-mode') === 'playerVsPlayer') {
            play(false)
        } else {
            if (el.getAttribute('data-mode') === 'playerVsComputer') {
                skillDiv.querySelector('.color-selection').classList.remove('hidden')
                skillDiv.querySelector('.start-btn').classList.add('hidden')
            } else {
                skillDiv.querySelector('.color-selection').classList.add('hidden')
                skillDiv.querySelector('.start-btn').classList.remove('hidden')
            }
            document.body.appendChild(skillDiv)
        }
    }
})

function play(setSkill = false, playerColor = color.white) {
    const selectedBtn = gamemodeDiv.querySelector('.toggle.selected')
    const mode = selectedBtn.getAttribute('data-mode')
    gamemodeDiv.parentElement.parentElement.classList.add('hidden')
    if (game) game.stop()
    game = Game(gamemode[mode] ?? gamemode.playerVsPlayer, playerColor, board)
    board.classList.toggle('flipped', playerColor === color.black)
    if (setSkill) game.setSkillLevel(+skillLevelInput.value, +skillTimeInput.value)
    skillDiv.remove()
    selectedBtn.classList.remove('selected')
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

socket.on('spectator', ({ fen, gameTime, players }) => {
    waitingDiv.remove()
    placeholderGame.stop()
    placeholderBoard.remove()
    removeAllTiles()
    if (game) game.stop()
    game = Game(
        gamemode.spectator,
        playerColor,
        board,
        socket,
        +gameTime,
        { fen },
        undefined,
        players,
    )
    document.body.appendChild(board)
    game.start()
})

socket.on('start', ({ gameTime, players }) => {
    waitingDiv.remove()
    placeholderGame.stop()
    placeholderBoard.remove()
    removeAllTiles()
    if (game) game.stop()
    game = Game(
        gamemode.multiplayer,
        playerColor,
        board,
        socket,
        +gameTime,
        undefined,
        undefined,
        players,
    )
    document.body.appendChild(board)
    game.start()
})

socket.on('invalid-move', () => {
    alert('invalid')
})

socket.on('move', ({ from, to }) => {
    game.movePiece(from, to)
})

const joinBtn = document.querySelector('div.play button.join-room')
const joinTemplate = document.querySelector('#join-template')

joinBtn.onclick = async () => {
    const joinDiv = document.importNode(joinTemplate.content.firstElementChild, true)
    const table = joinDiv.querySelector('table')
    const cancelBtn = joinDiv.querySelector('button.cancel-btn')
    cancelBtn.onclick = () => {
        joinDiv.remove()
    }
    document.body.appendChild(joinDiv)
    const rooms = await getRooms()
    for (const room of rooms) {
        const row = document.createElement('tr')

        const player = document.createElement('td')
        const elo = document.createElement('td')
        const time = document.createElement('td')
        const join = document.createElement('td')

        const aJoin = document.createElement('a')

        player.textContent = room.player.username
        elo.textContent = room.player.elo
        time.textContent = +room.time / 60 + ' m'
        aJoin.href = `?r=${room.roomId}`
        aJoin.textContent = 'Join'
        join.appendChild(aJoin)

        row.onclick = () => {
            location.href = aJoin.href
        }

        row.appendChild(player)
        row.appendChild(elo)
        row.appendChild(time)
        row.appendChild(join)

        table.appendChild(row)
    }
}

function getRooms() {
    return new Promise((resolve, reject) => {
        socket.on('get-rooms', (rooms) => {
            resolve(rooms)
        })
        socket.emit('get-rooms')
    })
}

if (!urlParams.has('r')) {
    socket.on('match-found', (roomId) => {
        location.href = `?r=${roomId}`
    })
    document.querySelector('.find-room').onclick = () => {
        if (!document.querySelector('.finding-game')) createFindingDiv()
    }
    function createFindingDiv() {
        const template = document.querySelector('#find-game-template')
        const div = document.importNode(template.content.firstElementChild, true)
        div.querySelector('.close-btn').onclick = () => {
            socket.emit('find-room-cancel')
            div.remove()
        }
        document.body.appendChild(div)
        setTimeout(() => {
            socket.emit('find-room')
        }, 500)
    }
}
