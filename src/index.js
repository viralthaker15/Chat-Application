const path = require('path')
const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const utils = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app) //express do this behind the scenes we are just explicitly writing for socketIO
const io = socketio(server) //socketio needs a default raw http server thats why we have to explicitly create server from http
//io is now serversocket


const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('New Web Socket Connection! !')

    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options }) //...options spread operator for username = options.username and so on..

        if (error) {
            return callback(error)
        }

        socket.join(user.room) // joins the specified room

        socket.emit('message', utils.generateMessage('Admin', 'Welcome !')) // it emits the message to whoever recieves the event using .on
        socket.broadcast.to(user.room).emit('message', utils.generateMessage('Admin', `${user.username} has joined the lobby !`)) //this emits an event to everybody except the user who invoked it

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback() //ackmowledgement to the user
    })

    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter()

        const user = getUser(socket.id)

        if (filter.isProfane(message))
            return callback('BadWords not allowed')

        socket.emit('message', utils.generateMessage('You', message)) // to only user who send it
        socket.broadcast.to(user.room).emit('message', utils.generateMessage(user.username, message)) // to all other members which are in room except sender

        //io.to(user.room).emit('message' , utils.generateMessage(user.username , message)) //this emits message to everybody whose connected in room
        callback()  //acknowledgement to the user
    })

    socket.on('sendLocation', (data, callback) => {

        const user = getUser(socket.id)

        socket.emit('locationMessage', utils.generateLocationMessage('You', `https://google.com/maps?q=${data.latitude},${data.longitude}`)) // to only user who send it
        socket.broadcast.to(user.room).emit('locationMessage', utils.generateLocationMessage(user.username, `https://google.com/maps?q=${data.latitude},${data.longitude}`)) // to all other members which are in room except sender

        //io.to(user.room).emit('locationMessage' , utils.generateLocationMessage(user.username, `https://google.com/maps?q=${data.latitude},${data.longitude}`))
        callback() //ackmowledgement to the user
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user)
            io.to(user.room).emit('message', utils.generateMessage('Admin', `${user.username} has left the lobby !`))

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

    })
})


server.listen(port, () => {
    console.log('Server is up on port :' + port)
}) 