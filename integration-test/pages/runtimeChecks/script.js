function init () {
    window.script1Ran = true
    const script = document.createElement('script')
    script.src = './script2.js'
    script.id = 'script2'
    script.setAttribute('magicalAttribute', 'yes')
    document.body.appendChild(script)
}
// Wait for setup
window.addEventListener('initialize', (e) => {
    init()
})
