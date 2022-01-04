'use strict'

import { sleep } from './sleep.js'

function pingInit() {
	async function config(element, delay, options) {
		await sleep(1000)
		const worker = new Worker(
			location.protocol +
				'//' +
				location.host +
				'/modules/workers/ping-worker.js'
		)
		worker.onmessage = (e) => {
			if (element) {
				element.textContent = e.data + ' ms'
				element.style.color = getColorForPing(+e.data, options) ?? ''
			}
			setTimeout(() => {
				worker.postMessage(null)
			}, delay)
		}
		worker.postMessage(null)
	}

	return {
		config,
	}
}

export function getColorForPing(ping, opt) {
	for (const key in opt)
		if (ping >= opt[key].min && ping <= opt[key].max) return opt[key].color
	return null
}

export const ping = pingInit()
