export default class Tile {
    x
    y
    element
    constructor(x, y, board, type) {
        this.x = x
        this.y = y
        this.type = type
        this.createElement()
        board.appendChild(this.element)
    }
    createElement() {
        this.element = document.createElement('div')
        this.element.classList.add('tile')
        this.element.classList.add(this.type)
        this.element.classList.add(posString(this.x, this.y))
        this.element.style.transform = `translateX(${this.x * 100}%) translateY(${this.y * 100}%)`
    }
}

function posString(x, y) {
    return `x${x}y${y}`
}