'use strict'

onmessage = async () => {
    const startTime = new Date().getTime()
    try {
        await fetch(location.protocol + '//' + location.host + '/ping')
        postMessage(new Date().getTime() - startTime)
    } catch (e) {
        postMessage(100)
    }
}