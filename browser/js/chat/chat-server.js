//html: chat in ChatArr
//chat.username , chat.date


var clientSocket = io(window.location.origin);
clientSocket.on('connect', function() {
        //this logs
        //console.log('Connected to server');
    });

app.controller('ChatController', function($scope, $http, $location, $anchorScroll, ChatFactory, ChatRoom) {
    $scope.chatArr = [];
    $scope.text = "";
    


    $scope.init = function() {
        //Get the current user, set to Guest if !User
        ChatFactory.getUser().then(function(res) {
            if(res) {
                $scope.currentUser = res.username;
                ChatRoom.userJoin($scope.currentUser);
            }
            else {
                $scope.currentUser = "Guest";
                $scope.currentUser.username = "Guest"
            }
        })
         ChatFactory.recentChat().then(function(topChats) {
            $scope.chatArr = topChats;
        })
    }

   

    $scope.init();



    // $scope.loadTexts = function() {

    //     $scope.textsLoaded = true;
    //     $scope.welcomeMsg = true;
    //     ChatFactory.load()
    //         .then(function(data) {
    //             data.forEach(function(textData) {
    //                 console.log('text data from db', textData)

    //                 $scope.chatArr.push(textData);
    //             });
    //         })
    // }


    $scope.submit = function() {
        //$location.hash('chatBubbles');
        if ($scope.text) {
            var addText = {
                content: this.text,
                username: $scope.currentUser
            };
            $scope.bubbleStyle = true;
            $scope.logChat(addText, true);
            //$scope.chatArr.push(addText);
            //also calling push in log chat
            $scope.text = "";
        }
    };


    $scope.logChat = function(data, shouldBroadcast) {
        ChatFactory.sendChat(data).then(function(res) {
            $scope.chatArr.push(res);
            if (shouldBroadcast) {
                console.log('preparing to emit', res)
                ChatRoom.emitChat(res);
            }
        });
    }

    $scope.showChat = function() {
        $scope.chatLogin = true;
    }
    $scope.rowClass = function(username) {
        if(username === $scope.currentUser) {
            return 'left'
        }
        else return 'right'
    }
    clientSocket.on('serverChat', function(data) {
        console.log('chat recieved from server', data);
        if(data.username !== $scope.currentUser){
            $scope.chatArr.push(data);
        }
        $scope.scrollBottom()
        $scope.$digest()
        //$scope.chatArr.push(res);
    })


    $scope.scrollBottom = function() {
        console.log("scrolling to bottom");
        $scope.scrollBox.prop('offsetTop');
        // var containerHeight = container.clientHeight;
        // var contentHeight = container.scrollHeight;

        // container.scrollTop = contentHeight - containerHeight;
    }

    // chatSocket.on('broadcastChat', function(data) {
    //     $scope.logChat(data)
    // })


})