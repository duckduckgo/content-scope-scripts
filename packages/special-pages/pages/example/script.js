const h2 = document.createElement('h2')
h2.innerText = 'This is an appended element'
document.body.appendChild(h2)

try {
    // @ts-expect-error
    document.body.appendChild('ooops!')
} catch (e) {
    console.log('warn: Expected error')
}
