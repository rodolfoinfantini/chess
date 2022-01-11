'use strict'
import { ping } from '../modules/ping.js'

import { serverDelay } from '../modules/serverDelay.js'

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

const preferences = JSON.parse(localStorage.getItem('preferences')) ?? {
    animationSpeed: 2,
    movesIndicator: 1,
    boardTheme: 'brown',
    skin: 0,
}
if (preferences.skin === undefined) preferences.skin = 0
if (preferences.animationSpeed === undefined) preferences.animationSpeed = 2
if (preferences.movesIndicator === undefined) preferences.movesIndicator = 1
if (preferences.boardTheme === undefined) preferences.boardTheme = 'brown'

save()
const animBtn = document.querySelector(
    `.animation-speed .toggle[data-value="${preferences.animationSpeed}"]`
)
if (animBtn) animBtn.classList.add('selected')
const movesBtn = document.querySelector(
    `.moves-indicator .toggle[data-value="${preferences.movesIndicator}"]`
)
if (movesBtn) movesBtn.classList.add('selected')
const themeBtn = document.querySelector(
    `.board-theme .toggle[data-value="${preferences.boardTheme}"]`
)
if (themeBtn) themeBtn.classList.add('selected')
const skinBtn = document.querySelector(`.skin .toggle[data-value="${preferences.skin}"]`)
if (skinBtn) skinBtn.classList.add('selected')

const buttons = document.querySelectorAll('button.toggle')

buttons.forEach((button) => {
    button.onclick = () => {
        button.parentElement.querySelectorAll('.selected').forEach((element) => {
            element.classList.remove('selected')
        })
        button.classList.add('selected')
    }
})

const saveBtn = document.querySelector('button.save')
saveBtn.onclick = () => {
    const animationSpeed = document.querySelector('.animation-speed .selected').dataset.value
    const movesIndicator = document.querySelector('.moves-indicator .selected').dataset.value
    const boardTheme = document.querySelector('.board-theme .selected').dataset.value
    const skin = document.querySelector('.skin .selected').dataset.value
    preferences.animationSpeed = animationSpeed
    preferences.movesIndicator = movesIndicator
    preferences.boardTheme = boardTheme
    preferences.skin = skin
    save()
    saveBtn.textContent = 'SAVED ✓'
    setTimeout(() => {
        saveBtn.textContent = 'SAVE'
    }, 1000)
}

function save() {
    localStorage.setItem('preferences', JSON.stringify(preferences))
}

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
