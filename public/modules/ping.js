'use strict'

function pingInit() {
    function config(element, delay, options) {
        const worker = new Worker(location.protocol + '//' + location.host + '/modules/workers/ping-worker.js')
        worker.onmessage = (e) => {
            if (element) {
                element.textContent = e.data + ' ms'
                element.style.color = getColorForPing(+e.data, options) || ''
            }
            setTimeout(() => {
                worker.postMessage(null)
            }, delay)
        }
        worker.postMessage(null)
    }

    function getColorForPing(ping, opt) {
        for (const key in opt)
            if (ping >= opt[key].min && ping <= opt[key].max) return opt[key].color
        return null
    }

    return {
        config
    }
}

export const ping = pingInit()