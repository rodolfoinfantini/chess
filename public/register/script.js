'use strict'

const form = document.querySelector('div.form form')
const error = document.querySelector('div.error')

let wait = false

form.onsubmit = async e => {
    e.preventDefault()

    if (wait) return
    wait = true

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: form.querySelector('input.username').value,
            password: form.querySelector('input.password').value,
            confirmPassword: form.querySelector('input.confirm-password').value,
            email: form.querySelector('input.email').value
        })
    }

    const response = await fetch(`${location.protocol}//${location.host}/account/register`, options)
    const data = await response.json()

    if (data.success) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('username', data.username)
        location.href = '../login'
        return
    }

    error.textContent = data.error
    wait = false
}