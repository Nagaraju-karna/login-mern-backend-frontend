const express = require('express');
let app = express()

app.use(express.json())

const bcrypt = require('bcrypt')

let { open } = require('sqlite')
const sqlite3 = require('sqlite3')

const jwt = require('jsonwebtoken')




let path = require('path')
let dbPath = path.join(__dirname, 'new_users.db')

const cors = require('cors')

app.use(cors())
let db = null

const initilizeDBAndServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        }
        )
        app.listen(3001, () => {
            console.log("server is running at http://localhost:3001/")
        })
    } catch (e) {
        console.error(`error ${e.message}`)
        process.exit(1)
    }
}

initilizeDBAndServer()
module.exports = app

app.post('/register', async (request, response) => {
    const { name, age, gender, password } = request.body


    const userExsist = `
        SELECT * FROM users WHERE  name=?
    `
    const confirmingUser = await db.get(userExsist, [name])

    if (confirmingUser === undefined) {
        const hashedPassword = await bcrypt.hash(password, 10)
        const creatingUser = `
            INSERT INTO users (name,age,gender,password)
            VALUES (?,?,?,?)
        `
        await db.run(creatingUser, [name, age, gender, hashedPassword])
        response.send('USER CREATED SUCCESSFULLY')
    } else {
        response.status(400)
        response.send('user already exists')
    }

})

app.post('/login', async (request, response) => {
    const { name, password } = request.body
    const isUserIsExists = `
        SELECT * FROM users WHERE name = ?
    `
    const userDetails = await db.get(isUserIsExists, [name])

    if (userDetails === undefined) {
        response.send('user no exists')
        response.status(401)
    } else {
        const userExistsComparePassword = await bcrypt.compare(password, userDetails.password)
        if (userExistsComparePassword === true) {
            const playload = { name: name }
            const jwtToken = jwt.sign(playload, 'juahdfhihasdf')
            response.send({ jwtToken })
        } else {
            response.status(401)
            response.send('wrong password')
        }
    }

})

app.get('/users', async (require, response) => {
    const userDetails = `
        SELECT * FROM users
    `
    const details = await db.all(userDetails)
    response.send(details)
})
