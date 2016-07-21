var chatSocket = io(window.location.origin);

chatSocket.on('connect', function() {
    console.log('Connected to server');
});

chatSocket.on('newChat', function() {

})

app.factory('ChatRoom', function($http) {
    var ChatRoom = {};

    ChatRoom.socket = io(window.location.origin);

    ChatRoom.socket.on('connect', function(client) {
    	console.log("connected client", client);
    })

    ChatRoom.socket.on('globalClient', function(client) {
    	console.log("new global client!", client);

    })
    ChatRoom.emitChat = function(contents) {
    	console.log('sending chat', contents);
    	ChatRoom.socket.emit('emitChat', contents)
    }
    ChatRoom.userJoin = function(user) {
    	ChatRoom.socket.emit('userJoin', user)
    }
   

    return ChatRoom;

})

