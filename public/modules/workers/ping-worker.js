'use strict'

onmessage = async () => {
    const startTime = new Date().getTime()
    try {
        const response = await fetch(location.protocol + '//' + location.host + '/ping')
        if (response.status !== 200) throw new Error()
        const time = await response.text()
        postMessage(+time - startTime)
    } catch (e) {
        postMessage(100)
    }
}