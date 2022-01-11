const urlParams = new URLSearchParams(window.location.search)

export function createBoard(appendTo = false, stopCallback, socket) {
    const boardElement = document.createElement('board')
    const preferences = JSON.parse(localStorage.getItem('preferences')) ?? {
        animationSpeed: 2,
        movesIndicator: 1,
        boardTheme: 'brown',
    }
    boardElement.setAttribute('animation-speed', preferences.animationSpeed)
    boardElement.setAttribute('moves-indicator', preferences.movesIndicator)
    const board = document.createElement('div')

    const img = new Image()
    img.src = location.origin + '/assets/board/skins/' + preferences.boardTheme + '.png'
    img.onerror = () => {
        img.src = location.origin + '/assets/board/skins/' + preferences.boardTheme + '.jpg'
        img.onerror = () => {
            img.src = location.origin + '/assets/board/skins/' + preferences.boardTheme + '.svg'
            img.onerror = () => {
                img.src = location.origin + '/assets/board/skins/brown.svg'
                img.onerror = () => {}
            }
        }
    }
    img.onload = () => (board.style.backgroundImage = 'url(' + img.src + ')')

    board.classList.add('board-content')
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
        boardElement.classList.toggle('flipped')
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

    if (urlParams.has('r')) {
        stopBtn.textContent = 'Resign'
        stopBtn.onclick = () => {
            if (socket) socket.emit('resign')
        }
    } else {
        stopBtn.textContent = 'Stop'
        stopBtn.onclick = () => {
            /* //if (game) game.startPos() //!here
            try {
                document.querySelector('body > div.play').classList.remove('hidden')
            } catch (e) {} */
            try {
                stopCallback()
            } catch (e) {}
        }
    }

    //playing as
    const playingAs = document.createElement('div')
    playingAs.classList.add('playing-as')

    //color to move
    const colorToMove = document.createElement('div')
    colorToMove.classList.add('color-to-move')

    options.appendChild(flipBtn)
    if (!urlParams.has('r')) options.appendChild(label)
    options.appendChild(stopBtn)
    // options.appendChild(playingAs)
    // options.appendChild(colorToMove)

    boardElement.appendChild(board)
    boardElement.appendChild(options)

    if (appendTo) {
        appendTo.appendChild(boardElement)
    }
    return boardElement
}
