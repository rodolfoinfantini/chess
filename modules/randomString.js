export default function randStr(lenth) {
	const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
	const numbers = '0123456789'
	const possible = letters + numbers

	let str = letters.charAt(Math.floor(Math.random() * letters.length))

	for (let i = 0; i < lenth - 1; i++)
		str += possible.charAt(Math.floor(Math.random() * possible.length))

	return str
}

export function randInt(length) {
	let str = ''
	for (let i = 0; i < length; i++) str += Math.floor(Math.random() * 10)
	return str
}
