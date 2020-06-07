//now that we have loaded this script to index.html with socket io
// we do have some stuffs that it would not otherwise 

const socket = io() //this function connects to server with websocket it is a function defined in socket.io/socket.io.js
//now this socket 

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $locationLink = document.querySelector('#locationlink')
const $sidebar = document.querySelector('#sidebar')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
//const queryStringObject = qs.parse(location.search , { ignoreQueryPrefix : true })
const {username , room} = Qs.parse(location.search , { ignoreQueryPrefix : true })

const autoscroll = () => {
    //New message element
    const $newMessage = $messages.lastElementChild

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage) //to get css margin bottom spacing value
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    //Height of messages container
    const containerHeight = $messages.scrollHeight

    //How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
            $messages.scrollTop = $messages.scrollHeight 
    }

}

socket.on('message' , (message) => {
    //console.log(message)
    const html = Mustache.render(messageTemplate , {
        username : message.username , 
        message : message.text ,
        createdAt : moment(message.createdAt).format('HH:mm a')
    })
    
    $messages.insertAdjacentHTML('beforeend' , html)
    autoscroll()
})

socket.on('locationMessage' , (message) => {
    //console.log(url)
    const html = Mustache.render(locationTemplate , {
        username : message.username ,
        url : message.url ,
        createdAt : moment(message.createdAt).format('HH:mm a')
    })
    $messages.insertAdjacentHTML('beforeend' , html)
    autoscroll()
})

socket.on('roomData' , ({ room , users }) => {
    const html = Mustache.render(sidebarTemplate , {
        room , 
        users
    })
    $sidebar.innerHTML = html
})

$messageForm.addEventListener('submit' , (e) => { // when form is submitted it invokes
    e.preventDefault()
    //here e stands for event argument

    //disable the msg button
    $messageFormButton.setAttribute('disabled' , 'disabled')

    const message = e.target.elements.message.value
    
    socket.emit('sendMessage' , message , (cberror) => {
        //enable the msg button
        $messageFormButton.removeAttribute('disabled')

        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(cberror)
           return console.log(cberror)

        console.log('the message was delivered !')
    })
})  

$sendLocationButton.addEventListener('click' , (e) => {

    //disable the button
    $sendLocationButton.setAttribute('disabled' , 'disabled')

    if(!navigator.geolocation)
        return alert('Geolocation is not available')

    navigator.geolocation.getCurrentPosition( (position) => {
        const data = {
            latitude : position.coords.latitude ,
            longitude : position.coords.longitude
        }  

        socket.emit('sendLocation' , data , () => {
            console.log('Location is shared')
            //enable the button
            $sendLocationButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join' , {username , room} , (error)=>{
    if(error)
    {
        alert(error)
        location.href = '/'  //to redirect them to index html
    }
}) // to join a room
