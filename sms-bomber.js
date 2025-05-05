import readline from 'node:readline'
import fs       from 'node:fs'

(async () => {
    const phone_number = await ask('Введіть номер телефону: +380')

    const services_str = await readFile('./services.json')
    const formatted_services_str = applyPhoneNumber(services_str, phone_number)

    const services = JSON.parse(formatted_services_str);

    for (let service of services) {
        const apis = service['apis']

        for (let api of apis) {
            const { url, method } = api

            const body = JSON.stringify(api['body'])
            const expected_response = JSON.stringify(api['expected_response'])

            await fetch(url, {
                'method': method,
                'body': body
            }).then(async (res) => {
                const json = await res.json()
                const response = JSON.stringify(json)

                console.log(url)
                console.log(response === expected_response)
            })
        }
    }
})()

function applyPhoneNumber(str_json, phone_number) {
    return str_json.replaceAll('{phone_number}', phone_number)
}

function readFile(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf8', (error, data) => {
            if (error) {
                reject(error)
                return
            }

            resolve(data)
        })
    })
}

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