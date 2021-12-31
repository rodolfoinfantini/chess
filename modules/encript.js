import crypto from 'crypto'

const algorithm = 'aes256'
const key = 'secretkeyshhhhhh!!!!!!!!!!'

export function encrypt(text) {
    const cipher = crypto.createCipher(algorithm, key)
    const crypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex')
    return crypted
}

export function decrypt(text) {
    const decipher = crypto.createDecipher(algorithm, key)
    const dec = decipher.update(text, 'hex', 'utf8') + decipher.final('utf8')
    return dec
}