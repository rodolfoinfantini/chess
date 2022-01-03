'use strict'

const form = document.querySelector('div.form form')
const error = document.querySelector('div.error')
const signInBtn = form.querySelector('button.submit')

let wait = false

form.onsubmit = async e => {
    e.preventDefault()
    if (wait) return
    wait = true

    signInBtn.innerHTML = '<div class="spinner white"></div>'

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: form.querySelector('input.username').value,
            password: form.querySelector('input.password').value
        })
    }

    const response = await fetch(`${location.protocol}//${location.host}/account/login`, options)
    const data = await response.json()

    if (data.success) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('username', data.username)
        location.href = '../'
        return
    }

    error.textContent = data.error
    signInBtn.textContent = 'SIGN IN'
    wait = false
}