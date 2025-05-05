import readline from 'readline'

(async () => {
    const text = await ask('input:')
    console.log(text)
})()

function ask(question) {
    const io = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    return new Promise((resolve) => io.question(question, (answer) => {
        io.close()
        resolve(answer)
    }))
}