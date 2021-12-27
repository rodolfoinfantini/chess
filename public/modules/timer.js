export default class Timer {
    isRunning = false
    startTime
    overallTime = 0
    maxTime = 0

    constructor(starting) {
        this.overallTime = starting
        this.maxTime = starting
    }

    getElapsedTimeSinceLastStart() {
        if (!this.startTime) return 0
        return Date.now() - this.startTime
    }

    start() {
        if (this.isRunning) return
        this.isRunning = true
        this.startTime = Date.now()
    }

    stop() {
        if (!this.isRunning) return
        this.isRunning = false
        this.overallTime -= this.getElapsedTimeSinceLastStart()
    }

    setTime(newTime) {
        this.overallTime = +newTime
    }

    reset() {
        this.overallTime = this.maxTime
        if (this.isRunning) {
            this.startTime = Date.now()
            return
        }

        this.startTime = 0
    }

    getTime() {
        if (!this.startTime) return this.maxTime
        if (this.isRunning) {
            return this.overallTime - this.getElapsedTimeSinceLastStart()
        }
        return this.overallTime
    }
}

export function msToSec(ms) {
    return (ms / 1000).toFixed(2)
}

export function timeString(time) {
    const minutes = Math.floor(time / 60)
    const seconds = (time % 60).toFixed(2)
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`
}

export function secToMs(sec) {
    return sec * 1000
}