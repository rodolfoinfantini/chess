'use strict'

onmessage = async () => {
    const startTime = new Date().getTime()
    try {
        const xhr = new XMLHttpRequest()
        xhr.open('GET', location.protocol + '//' + location.host + '/ping', true)
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                postMessage(new Date().getTime() - startTime)
            }
        }
        try {
            xhr.send(null)
        } catch (error) {
            postMessage(new Date().getTime() - startTime)
        }
        /* await fetch(location.protocol + '//' + location.host + '/ping')
        postMessage(new Date().getTime() - startTime) */
    } catch (e) {
        postMessage(100)
    }
}