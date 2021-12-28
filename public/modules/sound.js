function player() {
    const path = `${location.pathname === '/' ? '' : '../'}assets/audios/lichess/`
    const audios = {
        move: new Audio(path + 'move.ogg'),
        capture: new Audio(path + 'capture.ogg'),
        castle: new Audio(path + 'move.ogg'),
        start: new Audio(path + 'end.ogg'),
        end: new Audio(path + 'end.ogg'),
    }

    const vol = 1
    audios.move.volume = vol
    audios.capture.volume = vol
    audios.castle.volume = vol
    audios.start.volume = vol
    audios.end.volume = vol

    function move() {
        audios.move.play()
    }

    function capture() {
        audios.capture.play()
    }

    function castle() {
        audios.castle.play()
    }

    function start() {
        audios.start.play()
    }

    function end() {
        audios.end.play()
    }

    function stop() {
        audios.move.pause()
        audios.capture.pause()
        audios.castle.pause()
        audios.start.pause()
        audios.end.pause()
    }

    return {
        move,
        capture,
        castle,
        stop,
        end,
        start
    }
}

export const play = player()