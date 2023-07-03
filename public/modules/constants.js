export const type = {
    pawn: 'pawn',
    rook: 'rook',
    knight: 'knight',
    bishop: 'bishop',
    queen: 'queen',
    king: 'king',
}

export const color = {
    white: 'white',
    black: 'black',
}

export const colorLetter = {
    [color.white]: 'w',
    [color.black]: 'b',
}

export const tile = {
    lastMove: 'lastMove',
    selected: 'selected',
    move: 'move',
    capture: 'capture',
    check: 'check',
}

export const letterToType = {
    p: type.pawn,
    r: type.rook,
    n: type.knight,
    b: type.bishop,
    q: type.queen,
    k: type.king,
}

export const letter = {
    [type.pawn]: {
        [color.white]: 'P',
        [color.black]: 'p',
    },
    [type.rook]: {
        [color.white]: 'R',
        [color.black]: 'r',
    },
    [type.knight]: {
        [color.white]: 'N',
        [color.black]: 'n',
    },
    [type.bishop]: {
        [color.white]: 'B',
        [color.black]: 'b',
    },
    [type.queen]: {
        [color.white]: 'Q',
        [color.black]: 'q',
    },
    [type.king]: {
        [color.white]: 'K',
        [color.black]: 'k',
    },
}

export const typeLetter = {
    [type.pawn]: 'P',
    [type.rook]: 'R',
    [type.knight]: 'N',
    [type.bishop]: 'B',
    [type.queen]: 'Q',
    [type.king]: 'K',
}

export const moveString = {
    x0: 'a',
    x1: 'b',
    x2: 'c',
    x3: 'd',
    x4: 'e',
    x5: 'f',
    x6: 'g',
    x7: 'h',
    y0: '8',
    y1: '7',
    y2: '6',
    y3: '5',
    y4: '4',
    y5: '3',
    y6: '2',
    y7: '1',
}

export const moveNumber = {
    xa: '0',
    xb: '1',
    xc: '2',
    xd: '3',
    xe: '4',
    xf: '5',
    xg: '6',
    xh: '7',
    y8: '0',
    y7: '1',
    y6: '2',
    y5: '3',
    y4: '4',
    y3: '5',
    y2: '6',
    y1: '7',
}

export const gamemode = {
    playerVsPlayer: 'playerVsPlayer',
    playerVsComputer: 'playerVsComputer',
    computerVsComputer: 'computerVsComputer',
    multiplayer: 'multiplayer',
    puzzle: 'puzzle',
    spectator: 'spectator',
    placeholder: 'placeholder',
}

export const state = {
    start: 'start',
    playing: 'playing',
    end: 'end',
}

export const info = {
    checkmate: 'checkmate',
    stalemate: 'stalemate',
    repetition: 'repetition',
    fiftyMoves: 'fiftyMoves',
    draw: 'draw',
    resign: 'resign',
    timeOut: 'timeOut',
    playerDisconnected: 'playerDisconnected',
}
