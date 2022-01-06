'use strict'

import { getColorForPing } from './ping.js'

function init() {
	function config(socket, element, colorConfig) {
		socket.on('server-delay', (delay) => {
			element.textContent = delay + ' ms'
			element.style.color = getColorForPing(delay, colorConfig) ?? ''
		})
	}
	return {
		config,
	}
}

export const serverDelay = init()
