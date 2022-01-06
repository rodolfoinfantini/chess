'use strict'

const form = document.querySelector('div.form form')
const error = document.querySelector('div.error')
const signInBtn = form.querySelector('button.submit')
const verificationTemplate = document.querySelector('template#verification')
const verification = verificationTemplate.content.querySelector('div.form.verify')

let wait = false

if (localStorage.getItem('email')) {
    createVerificationDiv(localStorage.getItem('email'))
}

form.onsubmit = async (e) => {
    e.preventDefault()

    if (wait) return
    wait = true

    signInBtn.innerHTML = '<div class="spinner white"></div>'

    const email = form.querySelector('input.email').value

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: form.querySelector('input.username').value,
            password: form.querySelector('input.password').value,
            confirmPassword: form.querySelector('input.confirm-password').value,
            email: email,
        }),
    }

    const response = await fetch(`${location.protocol}//${location.host}/account/register`, options)
    const data = await response.json()

    if (data.success) {
        // location.href = '../login'
        wait = false
        localStorage.setItem('email', email)
        createVerificationDiv(email)
        return
    }

    error.textContent = data.error
    signInBtn.textContent = 'REGISTER'
    wait = false
}

function createVerificationDiv(email) {
    const resendBtn = verification.querySelector('p.resend')
    const verificationCodeInput = verification.querySelector('input.verification-code')
    const verificationForm = verification.querySelector('form')
    const btn = verification.querySelector('button.submit')
    const error = verification.querySelector('div.error')
    verificationForm.onsubmit = async (e) => {
        e.preventDefault()

        if (wait) return
        wait = true

        btn.innerHTML = '<div class="spinner white"></div>'

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                code: verificationCodeInput.value,
            }),
        }

        const response = await fetch(
            `${location.protocol}//${location.host}/account/verify`,
            options
        )
        const data = await response.json()

        if (data.success) {
            localStorage.removeItem('email')
            location.href = '../login'
            return
        }

        btn.textContent = 'VERIFY'
        error.textContent = 'The verification code is invalid'
        verificationCodeInput.value = ''
        wait = false
    }
    function createTimer() {
        let secs = 30
        resendBtn.onclick = () => {}
        resendBtn.textContent = `Wait ${secs} seconds to resend email`
        let timer = setInterval(() => {
            secs--
            resendBtn.textContent = `Wait ${secs} seconds to resend email`
            if (secs === 0) {
                resendBtn.textContent = 'Resend email'
                clearInterval(timer)
                resendBtn.onclick = () => {
                    createTimer()
                    fetch(`${location.protocol}//${location.host}/account/verify/resend`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            email: email,
                        }),
                    })
                }
            }
        }, 1000)
    }
    createTimer()
    form.parentElement.parentElement.appendChild(verification)
    form.parentElement.remove()
}
