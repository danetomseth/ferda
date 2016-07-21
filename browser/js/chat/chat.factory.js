app.factory('ChatFactory', function($http, $rootScope, AuthService) {
    var ChatFactory = {}

    

    ChatFactory.sendChat = function(data) {
        return $http.post("/api/chats", data).then(function(content) {
                return content.data
            })
    }

    ChatFactory.load = function() {
        return $http.get("/api/chats").then(function(textDb) {
            console.log('recovered chats', textDb.data);
            return textDb.data;
        })
    }

    ChatFactory.getUser = function() {
        return AuthService.getLoggedInUser();
    }

    ChatFactory.recentChat = function() {
        return $http.get('/api/chats/recent').then(function(res) {
            return res.data;
        })
    }

    return ChatFactory;



})


// return {

//     sendChat: function(data) {
//         return $http.post("/api/chats", data)
//             .then(function(content) {
//                 return content.data
//             })
//     },

//     load: function() {
//         return $http.get("/api/chats").then(function(textDb) {
//             console.log('recovered chats', textDb.data);
//             return textDb.data;
//         })
//     },

//     getUser: function() {
//         return AuthService.getLoggedInUser();
//     },

//     recentChat: function() {
//         return $http.get('/api/chats/recent').then(function(res) {
//             return res.data;
//         })
//     }
// }


// console.log('logged in user', $rootScope.loggedInUser) // from app.js
// console.log('online user', $rootScope.onlineUser) // from fsa/pre-build