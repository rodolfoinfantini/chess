'use strict'

import { getColorForPing } from './ping.js'

function init() {
    function config(socket, element, colorConfig) {
        socket.on('server-delay', (delay) => {
            element.textContent = delay + ' ms'
            element.style.color = getColorForPing(delay, colorConfig) ?? ''
        })
        const playersValueDiv = document.querySelector('.info-wrapper .players-value')
        if (playersValueDiv) {
            socket.on('connections', (players) => {
                playersValueDiv.textContent = players
            })
        }
        const playingDiv = document.querySelector('.info-wrapper .playing-value')
        if (playingDiv) {
            socket.on('playing', (playing) => {
                playingDiv.textContent = playing
            })
        }
    }
    return {
        config,
    }
}

export const serverDelay = init()
