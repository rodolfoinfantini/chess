export default class Move {
    x
    y
    capture = false
    constructor(x, y, capture = false) {
        this.x = x
        this.y = y
        this.capture = capture
    }
}