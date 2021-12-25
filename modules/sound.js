function player() {
    const path = 'assets/audios/lichess/'
    const audios = {
        move: new Audio(path + 'move.ogg'),
        capture: new Audio(path + 'capture.ogg'),
        castle: new Audio(path + 'move.ogg')
    }

    const vol = 1
    audios.move.volume = vol
    audios.capture.volume = vol
    audios.castle.volume = vol

    function move() {
        audios.move.play()
    }

    function capture() {
        audios.capture.play()
    }

    function castle() {
        audios.castle.play()
    }

    function stop() {
        audios.move.pause()
        audios.capture.pause()
        audios.castle.pause()
    }

    return {
        move,
        capture,
        castle,
        stop
    }
}

export const play = player()