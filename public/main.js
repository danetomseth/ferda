'use strict';
window.app = angular.module('FullstackGeneratedApp', ['fsaPreBuilt', 'bootstrapLightbox', 'ui.router', 'ui.bootstrap', 'ngAnimate', 'angularFileUpload', 'ngMaterial']);

app.config(function ($urlRouterProvider, $locationProvider) {
    // This turns off hashbang urls (/#about) and changes it to something normal (/about)
    $locationProvider.html5Mode(true);
    // If we go to a URL that ui-router doesn't have registered, go to the "/" url.
    $urlRouterProvider.otherwise('/');
});

// This app.run is for controlling access to specific states.
app.run(function ($rootScope, AuthService, $state) {

    // The given state requires an authenticated user.
    var destinationStateRequiresAuth = function destinationStateRequiresAuth(state) {
        return state.data && state.data.authenticate;
    };

    // $stateChangeStart is an event fired
    // whenever the process of changing a state begins.
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {

        if (!destinationStateRequiresAuth(toState)) {
            // The destination state does not require authentication
            // Short circuit with return.
            return;
        }

        if (AuthService.isAuthenticated()) {
            // The user is authenticated.
            // Short circuit with return.
            return;
        }

        // Cancel navigating to new state.
        event.preventDefault();

        AuthService.getLoggedInUser().then(function (user) {
            // If a user is retrieved, then renavigate to the destination
            // (the second time, AuthService.isAuthenticated() will work)
            // otherwise, if no user is logged in, go to "login" state.
            //$rootScope.loggedInUser = user;
            console.log('user from app', user);
            if (user) {
                $state.go(toState.name, toParams);
            } else {
                $state.go('login');
            }
        });
    });
});

app.controller("AdminCtrl", function ($scope, $state, AdminFactory, AlbumFactory, PhotosFactory) {
    $scope.addingPictures = false;

    AlbumFactory.fetchAll().then(function (albums) {
        console.log('fetched', albums);
        $scope.albums = albums;
        $scope.albumOne = $scope.albums[0];
    });

    PhotosFactory.fetchTen().then(function (photos) {
        $scope.photos = photos;
    });

    $scope.deleteAlbum = function (album) {
        AlbumFactory.deleteAlbum(album._id);
        var albumIndex = $scope.albums.indexOf(album);
        $scope.albums.splice(albumIndex, 1);
    };

    $scope.createAlbum = function () {
        var album = {
            title: $scope.newAlbum
        };
        AlbumFactory.createAlbum(album).then(function (album) {
            $scope.albums.push(album);
            $scope.newAlbum = "";
        });
    };

    $scope.addPhotos = function (album) {
        $scope.selectingPictures = true;
        $scope.currentAlbum = album;
        PhotosFactory.fetchAll().then(function (photos) {
            $scope.photos = photos;
        });
    };

    $scope.viewAlbum = function (album) {
        $state.go('singleAlbum', { albumId: album._id });
    };

    $scope.updateAlbum = function () {
        AlbumFactory.updateAlbum($scope.currentAlbum).then(function (res) {
            $state.reload();
        });
    };

    $scope.uploadPhotos = function () {
        $state.go('uploadPhotos');
    };

    $scope.addToAlbum = function (photo) {
        $scope.currentAlbum.photos.push(photo._id);
    };
});
app.factory("AdminFactory", function ($http) {
    return {};
});
app.config(function ($stateProvider) {
    $stateProvider.state('admin', {
        url: '/admin',
        templateUrl: 'templates/admin.html',
        controller: 'AlbumCtrl'
    });
});
app.controller('AlbumCtrl', function ($scope, $timeout, $state, AdminFactory, AlbumFactory, PhotosFactory, DialogFactory) {
    $scope.addingPictures = false;

    AlbumFactory.fetchAll().then(function (albums) {
        $scope.albums = albums;
        $scope.albumOne = $scope.albums[0];
    });

    PhotosFactory.fetchTen().then(function (photos) {
        $scope.photos = photos;
    });

    $scope.deleteAlbum = function (album) {
        AlbumFactory.deleteAlbum(album._id);
        var albumIndex = $scope.albums.indexOf(album);
        $scope.albums.splice(albumIndex, 1);
    };

    $scope.createAlbum = function () {
        var album = {
            title: $scope.newAlbum
        };
        AlbumFactory.createAlbum(album).then(function (album) {
            $scope.albums.push(album);
            $scope.newAlbum = "";
        });
    };

    $scope.addPhotos = function (album) {
        $scope.selectingPictures = true;
        $scope.currentAlbum = album;
        PhotosFactory.fetchAll().then(function (photos) {
            $scope.photos = photos;
        });
    };

    $scope.viewAlbum = function (album) {};

    $scope.updateAlbum = function () {
        AlbumFactory.updateAlbum($scope.currentAlbum).then(function (res) {
            DialogFactory.display("Updated", 1500);
            $timeout(function () {
                $state.reload();
            }, 1000);
        });
    };

    $scope.viewAlbum = function (album) {
        $state.go('singleAlbum', { albumId: album._id });
    };

    $scope.addToAlbum = function (photo) {
        $scope.currentAlbum.photos.push(photo._id);
        DialogFactory.display("Added", 1000);
    };
});
app.factory('AlbumFactory', function ($http) {
    return {
        createAlbum: function createAlbum(album) {
            return $http.post('/api/albums/', album).then(function (res) {
                return res.data;
            });
        },
        fetchAll: function fetchAll() {
            return $http.get('/api/albums/').then(function (res) {
                return res.data;
            });
        },
        updateAlbum: function updateAlbum(album) {
            return $http.post('/api/albums/update', album).then(function (res) {
                return res.data;
            });
        },
        fetchOne: function fetchOne(albumId) {
            return $http.get('/api/albums/' + albumId).then(function (res) {
                return res.data;
            });
        },
        addPhoto: function addPhoto(photoId) {
            return $http.post('/api/albums/photo/' + photoId).then(function (res) {
                return res.data;
            });
        },
        deleteAlbum: function deleteAlbum(albumId) {
            return $http['delete']('/api/albums/' + albumId);
        }
    };
});
app.config(function ($stateProvider) {
    $stateProvider.state('album', {
        url: '/Album',
        templateUrl: 'js/album/album.html'

    });
});

app.config(function ($stateProvider) {
    $stateProvider.state('singleAlbum', {
        url: '/Album/:albumId',
        templateUrl: 'templates/single-album.html',
        controller: 'SingleAlbumCtrl',
        resolve: {
            album: function album(AlbumFactory, $stateParams) {
                return AlbumFactory.fetchOne($stateParams.albumId);
            }
        }

    });
});

app.controller('AlbumsCtrl', function ($scope, $state, PhotosFactory, AlbumFactory) {
    AlbumFactory.fetchAll().then(function (albums) {
        $scope.albums = albums;
        $scope.albumOne = $scope.albums[0];
    });

    $scope.viewAlbum = function (album) {
        $state.go('singleAlbum', { albumId: album._id });
    };
});

app.config(function ($stateProvider) {
    $stateProvider.state('albums', {
        url: '/albums',
        templateUrl: '/albums.html',
        controller: 'AlbumsCtrl'
    });
});
app.config(function ($stateProvider) {
    $stateProvider.state('newAlbum', {
        url: '/newAlbum',
        templateUrl: '/new-album.html',
        controller: 'NewAlbumCtrl'
    });
});

app.controller('NewAlbumCtrl', function ($state, AlbumFactory, PhotosFactory, DialogFactory) {
    $scope.createAlbum = function () {
        var album = {
            title: $scope.newAlbum
        };
        AlbumFactory.createAlbum(album).then(function (album) {
            DialogFactory.display("Created");
        });
    };
});
app.controller('SingleAlbumCtrl', function ($scope, $timeout, $state, album, AdminFactory, AlbumFactory, PhotosFactory) {
    $scope.album = album;
    $scope.selectingCover = false;
    $scope.removeFromAlbum = function (photo) {
        var photoIndex = $scope.album.photos.indexOf(photo);
        $scope.album.photos.splice(photoIndex, 1);
    };

    $scope.selectCover = function () {
        $timeout(function () {
            $scope.selectingCover = true;
        }, 500);
    };

    $scope.addCover = function (photo) {
        $scope.album.cover = photo._id;
        $scope.selectingCover = false;
    };

    $scope.updateAlbum = function () {
        AlbumFactory.updateAlbum($scope.album).then(function (res) {
            $state.go('admin');
        });
    };
});
//html: chat in ChatArr
//chat.username , chat.date

var clientSocket = io(window.location.origin);
clientSocket.on('connect', function () {
    //this logs
    //console.log('Connected to server');
});

app.controller('ChatController', function ($scope, $http, $location, $anchorScroll, ChatFactory, ChatRoom) {
    $scope.chatArr = [];
    $scope.text = "";

    $scope.init = function () {
        //Get the current user, set to Guest if !User
        ChatFactory.getUser().then(function (res) {
            if (res) {
                $scope.currentUser = res.username;
                ChatRoom.userJoin($scope.currentUser);
            } else {
                $scope.currentUser = "Guest";
                $scope.currentUser.username = "Guest";
            }
        });
        ChatFactory.recentChat().then(function (topChats) {
            $scope.chatArr = topChats;
        });
    };

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

    $scope.submit = function () {
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

    $scope.logChat = function (data, shouldBroadcast) {
        ChatFactory.sendChat(data).then(function (res) {
            $scope.chatArr.push(res);
            if (shouldBroadcast) {
                console.log('preparing to emit', res);
                ChatRoom.emitChat(res);
            }
        });
    };

    $scope.showChat = function () {
        $scope.chatLogin = true;
    };
    $scope.rowClass = function (username) {
        if (username === $scope.currentUser) {
            return 'left';
        } else return 'right';
    };
    clientSocket.on('serverChat', function (data) {
        console.log('chat recieved from server', data);
        if (data.username !== $scope.currentUser) {
            $scope.chatArr.push(data);
        }
        $scope.scrollBottom();
        $scope.$digest();
        //$scope.chatArr.push(res);
    });

    $scope.scrollBottom = function () {
        console.log("scrolling to bottom");
        $scope.scrollBox.prop('offsetTop');
        // var containerHeight = container.clientHeight;
        // var contentHeight = container.scrollHeight;

        // container.scrollTop = contentHeight - containerHeight;
    };

    // chatSocket.on('broadcastChat', function(data) {
    //     $scope.logChat(data)
    // })
});
var chatSocket = io(window.location.origin);

chatSocket.on('connect', function () {
    console.log('Connected to server');
});

chatSocket.on('newChat', function () {});

app.factory('ChatRoom', function ($http) {
    var ChatRoom = {};

    ChatRoom.socket = io(window.location.origin);

    ChatRoom.socket.on('connect', function (client) {
        console.log("connected client", client);
    });

    ChatRoom.socket.on('globalClient', function (client) {
        console.log("new global client!", client);
    });
    ChatRoom.emitChat = function (contents) {
        console.log('sending chat', contents);
        ChatRoom.socket.emit('emitChat', contents);
    };
    ChatRoom.userJoin = function (user) {
        ChatRoom.socket.emit('userJoin', user);
    };

    return ChatRoom;
});

app.factory('ChatFactory', function ($http, $rootScope, AuthService) {
    var ChatFactory = {};

    ChatFactory.sendChat = function (data) {
        return $http.post("/api/chats", data).then(function (content) {
            return content.data;
        });
    };

    ChatFactory.load = function () {
        return $http.get("/api/chats").then(function (textDb) {
            console.log('recovered chats', textDb.data);
            return textDb.data;
        });
    };

    ChatFactory.getUser = function () {
        return AuthService.getLoggedInUser();
    };

    ChatFactory.recentChat = function () {
        return $http.get('/api/chats/recent').then(function (res) {
            return res.data;
        });
    };

    return ChatFactory;
});

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
app.config(function ($stateProvider) {
    $stateProvider.state('chat', {
        url: '/chat',
        templateUrl: 'js/chat/chat.html'

    });
});

(function () {

    'use strict';

    // Hope you didn't forget Angular! Duh-doy.
    if (!window.angular) throw new Error('I can\'t find Angular!');

    var app = angular.module('fsaPreBuilt', []);

    app.factory('Socket', function () {
        if (!window.io) throw new Error('socket.io not found!');
        return window.io(window.location.origin);
    });

    // AUTH_EVENTS is used throughout our app to
    // broadcast and listen from and to the $rootScope
    // for important events about authentication flow.
    app.constant('AUTH_EVENTS', {
        loginSuccess: 'auth-login-success',
        loginFailed: 'auth-login-failed',
        logoutSuccess: 'auth-logout-success',
        sessionTimeout: 'auth-session-timeout',
        notAuthenticated: 'auth-not-authenticated',
        notAuthorized: 'auth-not-authorized'
    });

    app.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
        var statusDict = {
            401: AUTH_EVENTS.notAuthenticated,
            403: AUTH_EVENTS.notAuthorized,
            419: AUTH_EVENTS.sessionTimeout,
            440: AUTH_EVENTS.sessionTimeout
        };
        return {
            responseError: function responseError(response) {
                $rootScope.$broadcast(statusDict[response.status], response);
                return $q.reject(response);
            }
        };
    });

    app.config(function ($httpProvider) {
        $httpProvider.interceptors.push(['$injector', function ($injector) {
            return $injector.get('AuthInterceptor');
        }]);
    });

    app.service('AuthService', function ($http, Session, $rootScope, AUTH_EVENTS, $q) {

        function onSuccessfulLogin(response) {
            var data = response.data;
            Session.create(data.id, data.user);
            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
            return data.user;
        }

        // Uses the session factory to see if an
        // authenticated user is currently registered.
        this.isAuthenticated = function () {
            return !!Session.user;
        };

        this.getLoggedInUser = function (fromServer) {

            // If an authenticated session exists, we
            // return the user attached to that session
            // with a promise. This ensures that we can
            // always interface with this method asynchronously.

            // Optionally, if true is given as the fromServer parameter,
            // then this cached value will not be used.

            if (this.isAuthenticated() && fromServer !== true) {
                return $q.when(Session.user);
            }

            // Make request GET /session.
            // If it returns a user, call onSuccessfulLogin with the response.
            // If it returns a 401 response, we catch it and instead resolve to null.
            return $http.get('/session').then(onSuccessfulLogin)['catch'](function () {
                return null;
            });
        };

        this.login = function (credentials) {
            return $http.post('/login', credentials).then(onSuccessfulLogin)['catch'](function () {
                return $q.reject({ message: 'Invalid login credentials.' });
            });
        };

        this.logout = function () {
            return $http.get('/logout').then(function () {
                Session.destroy();
                $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
            });
        };
    });

    app.service('Session', function ($rootScope, AUTH_EVENTS) {

        var self = this;

        $rootScope.$on(AUTH_EVENTS.notAuthenticated, function () {
            self.destroy();
        });

        $rootScope.$on(AUTH_EVENTS.sessionTimeout, function () {
            self.destroy();
        });

        this.id = null;
        this.user = null;

        this.create = function (sessionId, user) {
            this.id = sessionId;
            this.user = user;
        };

        this.destroy = function () {
            this.id = null;
            this.user = null;
        };
    });
})();

app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: '/home.html'
    });
});
app.controller('PhotoCtrl', function ($scope, $state, PhotosFactory, AlbumFactory) {
    var albumArray = [];
    $scope.title = "Welcome";
    $scope.photosGot = false;
    $scope.uploadPage = function () {
        $state.go('addphoto');
    };

    AlbumFactory.fetchAll().then(function (albums) {
        console.log('fetched', albums);
        $scope.albums = albums;
    });
    PhotosFactory.fetchAll().then(function (photos) {
        $scope.photos = photos;
    });

    $scope.addPhotos = function () {
        for (var i = 1; i <= 44; i++) {
            var src = '/image/IMG_' + i + '.jpg';
            PhotosFactory.addPhoto(src);
        }
    };

    $scope.fetchAll = function () {
        PhotosFactory.fetchAll().then(function (photos) {
            $scope.photos = photos;
        });
    };

    $scope.createAlbum = function () {
        $scope.newAlbum = {
            title: $scope.albumName,
            photos: ['image/IMG_1.jpg']
        };
        PhotosFactory.createAlbum($scope.newAlbum);
    };

    $scope.getAlbums = function () {
        PhotosFactory.fetchAlbums().then(function (albums) {
            $scope.albums = albums;
        });
    };

    $scope.addToAlbum = function (photo) {
        albumArray.push(photo);
    };

    $scope.saveAlbum = function () {
        console.log('album array', albumArray);
    };
});
app.factory('PhotosFactory', function ($http) {
    return {
        addPhoto: function addPhoto(src) {
            var photo = {
                src: src,
                name: 'test'
            };
            $http.post('/api/photos/add', photo).then(function (res) {});
        },
        savePhoto: function savePhoto(photo) {
            $http.post('/api/photos/update', photo).then(function (res) {
                console.log(res.data);
            });
        },
        fetchAll: function fetchAll() {
            return $http.get('/api/photos').then(function (res) {
                return res.data;
            });
        },
        fetchTen: function fetchTen() {
            return $http.get('/api/photos/limit10').then(function (res) {
                return res.data;
            });
        }
    };
});
app.controller('UploadPhotoCtrl', function ($scope, $state, PhotosFactory, AlbumFactory, FileUploader) {
    var uploader = $scope.uploader = new FileUploader({
        url: '/api/upload/upload'
    });
    uploader.filters.push({
        name: 'imageFilter',
        fn: function fn(item, /*{File|FileLikeObject}*/options) {
            var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
            return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
        }
    });
    uploader.onWhenAddingFileFailed = function (item, /*{File|FileLikeObject}*/filter, options) {
        console.info('onWhenAddingFileFailed', item, filter, options);
    };
    uploader.onAfterAddingFile = function (fileItem) {
        console.info('onAfterAddingFile', fileItem);
    };
    uploader.onAfterAddingAll = function (addedFileItems) {
        console.info('onAfterAddingAll', addedFileItems);
    };
    uploader.onBeforeUploadItem = function (item) {
        console.info('onBeforeUploadItem', item);
    };
    uploader.onProgressItem = function (fileItem, progress) {
        console.info('onProgressItem', fileItem, progress);
    };
    uploader.onProgressAll = function (progress) {
        console.info('onProgressAll', progress);
    };
    uploader.onSuccessItem = function (fileItem, response, status, headers) {
        console.info('onSuccessItem', fileItem, response, status, headers);
    };
    uploader.onErrorItem = function (fileItem, response, status, headers) {
        console.info('onErrorItem', fileItem, response, status, headers);
    };
    uploader.onCancelItem = function (fileItem, response, status, headers) {
        console.info('onCancelItem', fileItem, response, status, headers);
    };
    uploader.onCompleteItem = function (fileItem, response, status, headers) {
        console.info('onCompleteItem', fileItem, response, status, headers);
    };
    uploader.onCompleteAll = function () {
        console.info('onCompleteAll');
        $scope.finish();
    };
});
app.config(function ($stateProvider) {
    $stateProvider.state('photos', {
        url: '/photos',
        templateUrl: '/photos.html',
        controller: 'PhotoCtrl'
    });
});

app.config(function ($stateProvider) {
    $stateProvider.state('addphoto', {
        url: '/photos',
        templateUrl: '/photos-add.html',
        controller: 'PhotoCtrl'
    });
});

app.config(function ($stateProvider) {
    $stateProvider.state('uploadPhotos', {
        url: '/upload',
        templateUrl: '/photos-upload.html',
        controller: 'UploadPhotoCtrl'
    });
});

app.factory('DialogFactory', function ($http, $mdDialog, $timeout) {

    var showDialog = function showDialog(message) {
        var parentEl = angular.element(document.body);
        $mdDialog.show({
            parent: parentEl,
            template: '<md-dialog aria-label="List dialog" id="dialog">' + '  <md-dialog-content>' + message + '  </md-dialog-content>' + '</md-dialog>'
        });
    };

    return {
        display: function display(message, timeout) {
            showDialog(message);
            $timeout(function () {
                $mdDialog.hide();
            }, timeout);
        }
    };
});
// app.directive('fullstackLogo', function () {
//     return {
//         restrict: 'E',
//         templateUrl: 'files/images/favicon.ico'
//     };
// });
app.directive('navbar', function ($rootScope, AuthService, AUTH_EVENTS, $state) {

    return {
        restrict: 'E',
        scope: {},
        templateUrl: '/navbar.html',
        link: function link(scope) {

            scope.items = [{ label: 'Home', state: 'home' }, { label: 'Photos', state: 'photos' }, { label: 'Albums', state: 'albums' }, { label: 'Admin', state: 'admin' }];

            scope.user = null;

            scope.isLoggedIn = function () {
                return AuthService.isAuthenticated();
            };

            scope.logout = function () {
                AuthService.logout().then(function () {
                    $state.go('home');
                });
            };

            var setUser = function setUser() {
                AuthService.getLoggedInUser().then(function (user) {
                    scope.user = user;
                });
            };

            var removeUser = function removeUser() {
                scope.user = null;
            };

            setUser();

            $rootScope.$on(AUTH_EVENTS.loginSuccess, setUser);
            $rootScope.$on(AUTH_EVENTS.logoutSuccess, removeUser);
            $rootScope.$on(AUTH_EVENTS.sessionTimeout, removeUser);
        }

    };
});

app.directive('photoEdit', function (PhotosFactory) {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/photo/photo-edit.html',
        link: function link(scope, elem, attr) {
            scope.savePhoto = function () {
                console.log('photo', scope.photo);
                PhotosFactory.savePhoto(scope.photo);
            };
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFkbWluL2FkbWluLWNvbnRyb2xsZXIuanMiLCJhZG1pbi9hZG1pbi1mYWN0b3J5LmpzIiwiYWRtaW4vYWRtaW4uanMiLCJhbGJ1bS9hbGJ1bS1jb250cm9sbGVyLmpzIiwiYWxidW0vYWxidW0tZmFjdG9yeS5qcyIsImFsYnVtL2FsYnVtLmpzIiwiYWxidW0vYWxidW1zLWNvbnRyb2xsZXIuanMiLCJhbGJ1bS9hbGJ1bXMuanMiLCJhbGJ1bS9uZXctYWxidW0uanMiLCJhbGJ1bS9zaW5nbGUtYWxidW0tY29udHJvbGxlci5qcyIsImNoYXQvY2hhdC1zZXJ2ZXIuanMiLCJjaGF0L2NoYXQtc29ja2V0LmpzIiwiY2hhdC9jaGF0LmZhY3RvcnkuanMiLCJjaGF0L2NoYXQuanMiLCJmc2EvZnNhLXByZS1idWlsdC5qcyIsImhvbWUvaG9tZS5qcyIsInBob3Rvcy9waG90b3MtY29udHJvbGxlci5qcyIsInBob3Rvcy9waG90b3MtZmFjdG9yeS5qcyIsInBob3Rvcy9waG90b3MtdXBsb2FkLWNvbnRyb2xsZXIuanMiLCJwaG90b3MvcGhvdG9zLmpzIiwiY29tbW9uL2RpYWxvZy9kaWFsb2ctZmFjdG9yeS5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy9waG90by9waG90by1lZGl0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQUEsQ0FBQTtBQUNBLE1BQUEsQ0FBQSxHQUFBLEdBQUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSx1QkFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLG1CQUFBLEVBQUEsV0FBQSxFQUFBLGNBQUEsRUFBQSxXQUFBLEVBQUEsbUJBQUEsRUFBQSxZQUFBLENBQUEsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxrQkFBQSxFQUFBLGlCQUFBLEVBQUE7O0FBRUEscUJBQUEsQ0FBQSxTQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7O0FBRUEsc0JBQUEsQ0FBQSxTQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7OztBQUdBLEdBQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTs7O0FBR0EsUUFBQSw0QkFBQSxHQUFBLFNBQUEsNEJBQUEsQ0FBQSxLQUFBLEVBQUE7QUFDQSxlQUFBLEtBQUEsQ0FBQSxJQUFBLElBQUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxZQUFBLENBQUE7S0FDQSxDQUFBOzs7O0FBSUEsY0FBQSxDQUFBLEdBQUEsQ0FBQSxtQkFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxRQUFBLEVBQUE7O0FBRUEsWUFBQSxDQUFBLDRCQUFBLENBQUEsT0FBQSxDQUFBLEVBQUE7OztBQUdBLG1CQUFBO1NBQ0E7O0FBRUEsWUFBQSxXQUFBLENBQUEsZUFBQSxFQUFBLEVBQUE7OztBQUdBLG1CQUFBO1NBQ0E7OztBQUdBLGFBQUEsQ0FBQSxjQUFBLEVBQUEsQ0FBQTs7QUFFQSxtQkFBQSxDQUFBLGVBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTs7Ozs7QUFLQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxlQUFBLEVBQUEsSUFBQSxDQUFBLENBQUE7QUFDQSxnQkFBQSxJQUFBLEVBQUE7QUFDQSxzQkFBQSxDQUFBLEVBQUEsQ0FBQSxPQUFBLENBQUEsSUFBQSxFQUFBLFFBQUEsQ0FBQSxDQUFBO2FBQ0EsTUFBQTtBQUNBLHNCQUFBLENBQUEsRUFBQSxDQUFBLE9BQUEsQ0FBQSxDQUFBO2FBQ0E7U0FDQSxDQUFBLENBQUE7S0FFQSxDQUFBLENBQUE7Q0FFQSxDQUFBLENBQUE7O0FDcERBLEdBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxZQUFBLEVBQUEsWUFBQSxFQUFBLGFBQUEsRUFBQTtBQUNBLFVBQUEsQ0FBQSxjQUFBLEdBQUEsS0FBQSxDQUFBOztBQUVBLGdCQUFBLENBQUEsUUFBQSxFQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsZUFBQSxDQUFBLEdBQUEsQ0FBQSxTQUFBLEVBQUEsTUFBQSxDQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxRQUFBLEdBQUEsTUFBQSxDQUFBLE1BQUEsQ0FBQSxDQUFBLENBQUEsQ0FBQTtLQUNBLENBQUEsQ0FBQTs7QUFFQSxpQkFBQSxDQUFBLFFBQUEsRUFBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQSxDQUFBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxvQkFBQSxDQUFBLFdBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxZQUFBLFVBQUEsR0FBQSxNQUFBLENBQUEsTUFBQSxDQUFBLE9BQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxNQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsRUFBQSxDQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFdBQUEsR0FBQSxZQUFBO0FBQ0EsWUFBQSxLQUFBLEdBQUE7QUFDQSxpQkFBQSxFQUFBLE1BQUEsQ0FBQSxRQUFBO1NBQ0EsQ0FBQTtBQUNBLG9CQUFBLENBQUEsV0FBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQTtBQUNBLGtCQUFBLENBQUEsUUFBQSxHQUFBLEVBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFNBQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxpQkFBQSxHQUFBLElBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxZQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EscUJBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxTQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxFQUFBLE9BQUEsRUFBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBR0EsVUFBQSxDQUFBLFdBQUEsR0FBQSxZQUFBO0FBQ0Esb0JBQUEsQ0FBQSxXQUFBLENBQUEsTUFBQSxDQUFBLFlBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsTUFBQSxFQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxZQUFBLEdBQUEsWUFBQTtBQUNBLGNBQUEsQ0FBQSxFQUFBLENBQUEsY0FBQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxVQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsWUFBQSxDQUFBLE1BQUEsQ0FBQSxJQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQzFEQSxHQUFBLENBQUEsT0FBQSxDQUFBLGNBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLFdBQUEsRUFFQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDSkEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsS0FBQSxDQUFBLE9BQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxRQUFBO0FBQ0EsbUJBQUEsRUFBQSxzQkFBQTtBQUNBLGtCQUFBLEVBQUEsV0FBQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ05BLEdBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFFBQUEsRUFBQSxNQUFBLEVBQUEsWUFBQSxFQUFBLFlBQUEsRUFBQSxhQUFBLEVBQUEsYUFBQSxFQUFBO0FBQ0EsVUFBQSxDQUFBLGNBQUEsR0FBQSxLQUFBLENBQUE7O0FBRUEsZ0JBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxRQUFBLEdBQUEsTUFBQSxDQUFBLE1BQUEsQ0FBQSxDQUFBLENBQUEsQ0FBQTtLQUNBLENBQUEsQ0FBQTs7QUFFQSxpQkFBQSxDQUFBLFFBQUEsRUFBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQSxDQUFBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxvQkFBQSxDQUFBLFdBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxZQUFBLFVBQUEsR0FBQSxNQUFBLENBQUEsTUFBQSxDQUFBLE9BQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxNQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsRUFBQSxDQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFdBQUEsR0FBQSxZQUFBO0FBQ0EsWUFBQSxLQUFBLEdBQUE7QUFDQSxpQkFBQSxFQUFBLE1BQUEsQ0FBQSxRQUFBO1NBQ0EsQ0FBQTtBQUNBLG9CQUFBLENBQUEsV0FBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQTtBQUNBLGtCQUFBLENBQUEsUUFBQSxHQUFBLEVBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFNBQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxpQkFBQSxHQUFBLElBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxZQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EscUJBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxTQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUEsRUFFQSxDQUFBOztBQUdBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsWUFBQTtBQUNBLG9CQUFBLENBQUEsV0FBQSxDQUFBLE1BQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx5QkFBQSxDQUFBLE9BQUEsQ0FBQSxTQUFBLEVBQUEsSUFBQSxDQUFBLENBQUE7QUFDQSxvQkFBQSxDQUFBLFlBQUE7QUFDQSxzQkFBQSxDQUFBLE1BQUEsRUFBQSxDQUFBO2FBQ0EsRUFBQSxJQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFNBQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxFQUFBLENBQUEsYUFBQSxFQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsVUFBQSxHQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLFlBQUEsQ0FBQSxNQUFBLENBQUEsSUFBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLHFCQUFBLENBQUEsT0FBQSxDQUFBLE9BQUEsRUFBQSxJQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7Q0FJQSxDQUFBLENBQUE7QUNoRUEsR0FBQSxDQUFBLE9BQUEsQ0FBQSxjQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxXQUFBO0FBQ0EsbUJBQUEsRUFBQSxxQkFBQSxLQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsSUFBQSxDQUFBLGNBQUEsRUFBQSxLQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7QUFDQSxnQkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxjQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7QUFDQSxtQkFBQSxFQUFBLHFCQUFBLEtBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsb0JBQUEsRUFBQSxLQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7QUFDQSxnQkFBQSxFQUFBLGtCQUFBLE9BQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsY0FBQSxHQUFBLE9BQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTtBQUNBLGdCQUFBLEVBQUEsa0JBQUEsT0FBQSxFQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxvQkFBQSxHQUFBLE9BQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTtBQUNBLG1CQUFBLEVBQUEscUJBQUEsT0FBQSxFQUFBO0FBQ0EsbUJBQUEsS0FBQSxVQUFBLENBQUEsY0FBQSxHQUFBLE9BQUEsQ0FBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDcENBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxPQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsUUFBQTtBQUNBLG1CQUFBLEVBQUEscUJBQUE7O0tBRUEsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQUdBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxhQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsaUJBQUE7QUFDQSxtQkFBQSxFQUFBLDZCQUFBO0FBQ0Esa0JBQUEsRUFBQSxpQkFBQTtBQUNBLGVBQUEsRUFBQTtBQUNBLGlCQUFBLEVBQUEsZUFBQSxZQUFBLEVBQUEsWUFBQSxFQUFBO0FBQ0EsdUJBQUEsWUFBQSxDQUFBLFFBQUEsQ0FBQSxZQUFBLENBQUEsT0FBQSxDQUFBLENBQUE7YUFDQTtTQUNBOztLQUVBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUNyQkEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxZQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLGFBQUEsRUFBQSxZQUFBLEVBQUE7QUFDQSxnQkFBQSxDQUFBLFFBQUEsRUFBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLFFBQUEsR0FBQSxNQUFBLENBQUEsTUFBQSxDQUFBLENBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxTQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxFQUFBLE9BQUEsRUFBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7Q0FFQSxDQUFBLENBQUE7O0FDWEEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsS0FBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxTQUFBO0FBQ0EsbUJBQUEsRUFBQSxjQUFBO0FBQ0Esa0JBQUEsRUFBQSxZQUFBO0tBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDTkEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsS0FBQSxDQUFBLFVBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxXQUFBO0FBQ0EsbUJBQUEsRUFBQSxpQkFBQTtBQUNBLGtCQUFBLEVBQUEsY0FBQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLGNBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxZQUFBLEVBQUEsYUFBQSxFQUFBLGFBQUEsRUFBQTtBQUNBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsWUFBQTtBQUNBLFlBQUEsS0FBQSxHQUFBO0FBQ0EsaUJBQUEsRUFBQSxNQUFBLENBQUEsUUFBQTtTQUNBLENBQUE7QUFDQSxvQkFBQSxDQUFBLFdBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSx5QkFBQSxDQUFBLE9BQUEsQ0FBQSxTQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNqQkEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxpQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFFBQUEsRUFBQSxNQUFBLEVBQUEsS0FBQSxFQUFBLFlBQUEsRUFBQSxZQUFBLEVBQUEsYUFBQSxFQUFBO0FBQ0EsVUFBQSxDQUFBLEtBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsY0FBQSxHQUFBLEtBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxlQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxZQUFBLFVBQUEsR0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBLE1BQUEsQ0FBQSxPQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsS0FBQSxDQUFBLE1BQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxFQUFBLENBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxnQkFBQSxDQUFBLFlBQUE7QUFDQSxrQkFBQSxDQUFBLGNBQUEsR0FBQSxJQUFBLENBQUE7U0FDQSxFQUFBLEdBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsUUFBQSxHQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLEtBQUEsQ0FBQSxLQUFBLEdBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxjQUFBLEdBQUEsS0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxvQkFBQSxDQUFBLFdBQUEsQ0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxFQUFBLENBQUEsT0FBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOzs7O0FDcEJBLElBQUEsWUFBQSxHQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsUUFBQSxDQUFBLE1BQUEsQ0FBQSxDQUFBO0FBQ0EsWUFBQSxDQUFBLEVBQUEsQ0FBQSxTQUFBLEVBQUEsWUFBQTs7O0NBR0EsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsZ0JBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsU0FBQSxFQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsUUFBQSxFQUFBO0FBQ0EsVUFBQSxDQUFBLE9BQUEsR0FBQSxFQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsSUFBQSxHQUFBLEVBQUEsQ0FBQTs7QUFJQSxVQUFBLENBQUEsSUFBQSxHQUFBLFlBQUE7O0FBRUEsbUJBQUEsQ0FBQSxPQUFBLEVBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxnQkFBQSxHQUFBLEVBQUE7QUFDQSxzQkFBQSxDQUFBLFdBQUEsR0FBQSxHQUFBLENBQUEsUUFBQSxDQUFBO0FBQ0Esd0JBQUEsQ0FBQSxRQUFBLENBQUEsTUFBQSxDQUFBLFdBQUEsQ0FBQSxDQUFBO2FBQ0EsTUFDQTtBQUNBLHNCQUFBLENBQUEsV0FBQSxHQUFBLE9BQUEsQ0FBQTtBQUNBLHNCQUFBLENBQUEsV0FBQSxDQUFBLFFBQUEsR0FBQSxPQUFBLENBQUE7YUFDQTtTQUNBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLENBQUEsVUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxPQUFBLEdBQUEsUUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFJQSxVQUFBLENBQUEsSUFBQSxFQUFBLENBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQkEsVUFBQSxDQUFBLE1BQUEsR0FBQSxZQUFBOztBQUVBLFlBQUEsTUFBQSxDQUFBLElBQUEsRUFBQTtBQUNBLGdCQUFBLE9BQUEsR0FBQTtBQUNBLHVCQUFBLEVBQUEsSUFBQSxDQUFBLElBQUE7QUFDQSx3QkFBQSxFQUFBLE1BQUEsQ0FBQSxXQUFBO2FBQ0EsQ0FBQTtBQUNBLGtCQUFBLENBQUEsV0FBQSxHQUFBLElBQUEsQ0FBQTtBQUNBLGtCQUFBLENBQUEsT0FBQSxDQUFBLE9BQUEsRUFBQSxJQUFBLENBQUEsQ0FBQTs7O0FBR0Esa0JBQUEsQ0FBQSxJQUFBLEdBQUEsRUFBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBOztBQUdBLFVBQUEsQ0FBQSxPQUFBLEdBQUEsVUFBQSxJQUFBLEVBQUEsZUFBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxRQUFBLENBQUEsSUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxPQUFBLENBQUEsSUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsZ0JBQUEsZUFBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsbUJBQUEsRUFBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLHdCQUFBLENBQUEsUUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO2FBQ0E7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxRQUFBLEdBQUEsWUFBQTtBQUNBLGNBQUEsQ0FBQSxTQUFBLEdBQUEsSUFBQSxDQUFBO0tBQ0EsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxRQUFBLEdBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxZQUFBLFFBQUEsS0FBQSxNQUFBLENBQUEsV0FBQSxFQUFBO0FBQ0EsbUJBQUEsTUFBQSxDQUFBO1NBQ0EsTUFDQSxPQUFBLE9BQUEsQ0FBQTtLQUNBLENBQUE7QUFDQSxnQkFBQSxDQUFBLEVBQUEsQ0FBQSxZQUFBLEVBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxlQUFBLENBQUEsR0FBQSxDQUFBLDJCQUFBLEVBQUEsSUFBQSxDQUFBLENBQUE7QUFDQSxZQUFBLElBQUEsQ0FBQSxRQUFBLEtBQUEsTUFBQSxDQUFBLFdBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsT0FBQSxDQUFBLElBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTtTQUNBO0FBQ0EsY0FBQSxDQUFBLFlBQUEsRUFBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLE9BQUEsRUFBQSxDQUFBOztLQUVBLENBQUEsQ0FBQTs7QUFHQSxVQUFBLENBQUEsWUFBQSxHQUFBLFlBQUE7QUFDQSxlQUFBLENBQUEsR0FBQSxDQUFBLHFCQUFBLENBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxTQUFBLENBQUEsSUFBQSxDQUFBLFdBQUEsQ0FBQSxDQUFBOzs7OztLQUtBLENBQUE7Ozs7O0NBT0EsQ0FBQSxDQUFBO0FDbEhBLElBQUEsVUFBQSxHQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsUUFBQSxDQUFBLE1BQUEsQ0FBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxFQUFBLENBQUEsU0FBQSxFQUFBLFlBQUE7QUFDQSxXQUFBLENBQUEsR0FBQSxDQUFBLHFCQUFBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsRUFBQSxDQUFBLFNBQUEsRUFBQSxZQUFBLEVBRUEsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxPQUFBLENBQUEsVUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsUUFBQSxRQUFBLEdBQUEsRUFBQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxNQUFBLEdBQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQSxRQUFBLENBQUEsTUFBQSxDQUFBLENBQUE7O0FBRUEsWUFBQSxDQUFBLE1BQUEsQ0FBQSxFQUFBLENBQUEsU0FBQSxFQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsZUFBQSxDQUFBLEdBQUEsQ0FBQSxrQkFBQSxFQUFBLE1BQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxDQUFBLGNBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLGVBQUEsQ0FBQSxHQUFBLENBQUEsb0JBQUEsRUFBQSxNQUFBLENBQUEsQ0FBQTtLQUVBLENBQUEsQ0FBQTtBQUNBLFlBQUEsQ0FBQSxRQUFBLEdBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxlQUFBLENBQUEsR0FBQSxDQUFBLGNBQUEsRUFBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLGdCQUFBLENBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEVBQUEsUUFBQSxDQUFBLENBQUE7S0FDQSxDQUFBO0FBQ0EsWUFBQSxDQUFBLFFBQUEsR0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLGdCQUFBLENBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEVBQUEsSUFBQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUdBLFdBQUEsUUFBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOztBQ2xDQSxHQUFBLENBQUEsT0FBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBO0FBQ0EsUUFBQSxXQUFBLEdBQUEsRUFBQSxDQUFBOztBQUlBLGVBQUEsQ0FBQSxRQUFBLEdBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxlQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsWUFBQSxFQUFBLElBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLE9BQUEsRUFBQTtBQUNBLG1CQUFBLE9BQUEsQ0FBQSxJQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLGVBQUEsQ0FBQSxJQUFBLEdBQUEsWUFBQTtBQUNBLGVBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxpQkFBQSxFQUFBLE1BQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLE1BQUEsQ0FBQSxJQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLGVBQUEsQ0FBQSxPQUFBLEdBQUEsWUFBQTtBQUNBLGVBQUEsV0FBQSxDQUFBLGVBQUEsRUFBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxlQUFBLENBQUEsVUFBQSxHQUFBLFlBQUE7QUFDQSxlQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsbUJBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLG1CQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFdBQUEsV0FBQSxDQUFBO0NBSUEsQ0FBQSxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDaENBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxNQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsT0FBQTtBQUNBLG1CQUFBLEVBQUEsbUJBQUE7O0tBRUEsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQ05BLENBQUEsWUFBQTs7QUFFQSxnQkFBQSxDQUFBOzs7QUFHQSxRQUFBLENBQUEsTUFBQSxDQUFBLE9BQUEsRUFBQSxNQUFBLElBQUEsS0FBQSxDQUFBLHdCQUFBLENBQUEsQ0FBQTs7QUFFQSxRQUFBLEdBQUEsR0FBQSxPQUFBLENBQUEsTUFBQSxDQUFBLGFBQUEsRUFBQSxFQUFBLENBQUEsQ0FBQTs7QUFFQSxPQUFBLENBQUEsT0FBQSxDQUFBLFFBQUEsRUFBQSxZQUFBO0FBQ0EsWUFBQSxDQUFBLE1BQUEsQ0FBQSxFQUFBLEVBQUEsTUFBQSxJQUFBLEtBQUEsQ0FBQSxzQkFBQSxDQUFBLENBQUE7QUFDQSxlQUFBLE1BQUEsQ0FBQSxFQUFBLENBQUEsTUFBQSxDQUFBLFFBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQTtLQUNBLENBQUEsQ0FBQTs7Ozs7QUFLQSxPQUFBLENBQUEsUUFBQSxDQUFBLGFBQUEsRUFBQTtBQUNBLG9CQUFBLEVBQUEsb0JBQUE7QUFDQSxtQkFBQSxFQUFBLG1CQUFBO0FBQ0EscUJBQUEsRUFBQSxxQkFBQTtBQUNBLHNCQUFBLEVBQUEsc0JBQUE7QUFDQSx3QkFBQSxFQUFBLHdCQUFBO0FBQ0EscUJBQUEsRUFBQSxxQkFBQTtLQUNBLENBQUEsQ0FBQTs7QUFFQSxPQUFBLENBQUEsT0FBQSxDQUFBLGlCQUFBLEVBQUEsVUFBQSxVQUFBLEVBQUEsRUFBQSxFQUFBLFdBQUEsRUFBQTtBQUNBLFlBQUEsVUFBQSxHQUFBO0FBQ0EsZUFBQSxFQUFBLFdBQUEsQ0FBQSxnQkFBQTtBQUNBLGVBQUEsRUFBQSxXQUFBLENBQUEsYUFBQTtBQUNBLGVBQUEsRUFBQSxXQUFBLENBQUEsY0FBQTtBQUNBLGVBQUEsRUFBQSxXQUFBLENBQUEsY0FBQTtTQUNBLENBQUE7QUFDQSxlQUFBO0FBQ0EseUJBQUEsRUFBQSx1QkFBQSxRQUFBLEVBQUE7QUFDQSwwQkFBQSxDQUFBLFVBQUEsQ0FBQSxVQUFBLENBQUEsUUFBQSxDQUFBLE1BQUEsQ0FBQSxFQUFBLFFBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTthQUNBO1NBQ0EsQ0FBQTtLQUNBLENBQUEsQ0FBQTs7QUFFQSxPQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsYUFBQSxFQUFBO0FBQ0EscUJBQUEsQ0FBQSxZQUFBLENBQUEsSUFBQSxDQUFBLENBQ0EsV0FBQSxFQUNBLFVBQUEsU0FBQSxFQUFBO0FBQ0EsbUJBQUEsU0FBQSxDQUFBLEdBQUEsQ0FBQSxpQkFBQSxDQUFBLENBQUE7U0FDQSxDQUNBLENBQUEsQ0FBQTtLQUNBLENBQUEsQ0FBQTs7QUFFQSxPQUFBLENBQUEsT0FBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQSxFQUFBLEVBQUE7O0FBRUEsaUJBQUEsaUJBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxnQkFBQSxJQUFBLEdBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTtBQUNBLG1CQUFBLENBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxFQUFBLEVBQUEsSUFBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO0FBQ0Esc0JBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxDQUFBLFlBQUEsQ0FBQSxDQUFBO0FBQ0EsbUJBQUEsSUFBQSxDQUFBLElBQUEsQ0FBQTtTQUNBOzs7O0FBSUEsWUFBQSxDQUFBLGVBQUEsR0FBQSxZQUFBO0FBQ0EsbUJBQUEsQ0FBQSxDQUFBLE9BQUEsQ0FBQSxJQUFBLENBQUE7U0FDQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxlQUFBLEdBQUEsVUFBQSxVQUFBLEVBQUE7Ozs7Ozs7Ozs7QUFVQSxnQkFBQSxJQUFBLENBQUEsZUFBQSxFQUFBLElBQUEsVUFBQSxLQUFBLElBQUEsRUFBQTtBQUNBLHVCQUFBLEVBQUEsQ0FBQSxJQUFBLENBQUEsT0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO2FBQ0E7Ozs7O0FBS0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxVQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsaUJBQUEsQ0FBQSxTQUFBLENBQUEsWUFBQTtBQUNBLHVCQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUVBLENBQUE7O0FBRUEsWUFBQSxDQUFBLEtBQUEsR0FBQSxVQUFBLFdBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsUUFBQSxFQUFBLFdBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxpQkFBQSxDQUFBLFNBQ0EsQ0FBQSxZQUFBO0FBQ0EsdUJBQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQSxFQUFBLE9BQUEsRUFBQSw0QkFBQSxFQUFBLENBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBLENBQUE7O0FBRUEsWUFBQSxDQUFBLE1BQUEsR0FBQSxZQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxTQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsWUFBQTtBQUNBLHVCQUFBLENBQUEsT0FBQSxFQUFBLENBQUE7QUFDQSwwQkFBQSxDQUFBLFVBQUEsQ0FBQSxXQUFBLENBQUEsYUFBQSxDQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQSxDQUFBO0tBRUEsQ0FBQSxDQUFBOztBQUVBLE9BQUEsQ0FBQSxPQUFBLENBQUEsU0FBQSxFQUFBLFVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQTs7QUFFQSxZQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7O0FBRUEsa0JBQUEsQ0FBQSxHQUFBLENBQUEsV0FBQSxDQUFBLGdCQUFBLEVBQUEsWUFBQTtBQUNBLGdCQUFBLENBQUEsT0FBQSxFQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7O0FBRUEsa0JBQUEsQ0FBQSxHQUFBLENBQUEsV0FBQSxDQUFBLGNBQUEsRUFBQSxZQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxPQUFBLEVBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTs7QUFFQSxZQUFBLENBQUEsRUFBQSxHQUFBLElBQUEsQ0FBQTtBQUNBLFlBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxNQUFBLEdBQUEsVUFBQSxTQUFBLEVBQUEsSUFBQSxFQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxFQUFBLEdBQUEsU0FBQSxDQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQTs7QUFFQSxZQUFBLENBQUEsT0FBQSxHQUFBLFlBQUE7QUFDQSxnQkFBQSxDQUFBLEVBQUEsR0FBQSxJQUFBLENBQUE7QUFDQSxnQkFBQSxDQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7U0FDQSxDQUFBO0tBRUEsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxFQUFBLENBQUE7O0FDcElBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxNQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsR0FBQTtBQUNBLG1CQUFBLEVBQUEsWUFBQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ0xBLEdBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxhQUFBLEVBQUEsWUFBQSxFQUFBO0FBQ0EsUUFBQSxVQUFBLEdBQUEsRUFBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLEtBQUEsR0FBQSxTQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsU0FBQSxHQUFBLEtBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxVQUFBLEdBQUEsWUFBQTtBQUNBLGNBQUEsQ0FBQSxFQUFBLENBQUEsVUFBQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLGdCQUFBLENBQUEsUUFBQSxFQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsZUFBQSxDQUFBLEdBQUEsQ0FBQSxTQUFBLEVBQUEsTUFBQSxDQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBQTtLQUNBLENBQUEsQ0FBQTtBQUNBLGlCQUFBLENBQUEsUUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFNBQUEsR0FBQSxZQUFBO0FBQ0EsYUFBQSxJQUFBLENBQUEsR0FBQSxDQUFBLEVBQUEsQ0FBQSxJQUFBLEVBQUEsRUFBQSxDQUFBLEVBQUEsRUFBQTtBQUNBLGdCQUFBLEdBQUEsR0FBQSxhQUFBLEdBQUEsQ0FBQSxHQUFBLE1BQUEsQ0FBQTtBQUNBLHlCQUFBLENBQUEsUUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxRQUFBLEdBQUEsWUFBQTtBQUNBLHFCQUFBLENBQUEsUUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFHQSxVQUFBLENBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxjQUFBLENBQUEsUUFBQSxHQUFBO0FBQ0EsaUJBQUEsRUFBQSxNQUFBLENBQUEsU0FBQTtBQUNBLGtCQUFBLEVBQUEsQ0FBQSxpQkFBQSxDQUFBO1NBQ0EsQ0FBQTtBQUNBLHFCQUFBLENBQUEsV0FBQSxDQUFBLE1BQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFNBQUEsR0FBQSxZQUFBO0FBQ0EscUJBQUEsQ0FBQSxXQUFBLEVBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxVQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLElBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFNBQUEsR0FBQSxZQUFBO0FBQ0EsZUFBQSxDQUFBLEdBQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxDQUFBLENBQUE7S0FDQSxDQUFBO0NBT0EsQ0FBQSxDQUFBO0FDM0RBLEdBQUEsQ0FBQSxPQUFBLENBQUEsZUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsV0FBQTtBQUNBLGdCQUFBLEVBQUEsa0JBQUEsR0FBQSxFQUFBO0FBQ0EsZ0JBQUEsS0FBQSxHQUFBO0FBQ0EsbUJBQUEsRUFBQSxHQUFBO0FBQ0Esb0JBQUEsRUFBQSxNQUFBO2FBQ0EsQ0FBQTtBQUNBLGlCQUFBLENBQUEsSUFBQSxDQUFBLGlCQUFBLEVBQUEsS0FBQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBLEVBQ0EsQ0FBQSxDQUFBO1NBQ0E7QUFDQSxpQkFBQSxFQUFBLG1CQUFBLEtBQUEsRUFBQTtBQUNBLGlCQUFBLENBQUEsSUFBQSxDQUFBLG9CQUFBLEVBQUEsS0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7QUFDQSxnQkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxhQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7QUFDQSxnQkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxxQkFBQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQzdCQSxHQUFBLENBQUEsVUFBQSxDQUFBLGlCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLGFBQUEsRUFBQSxZQUFBLEVBQUEsWUFBQSxFQUFBO0FBQ0EsUUFBQSxRQUFBLEdBQUEsTUFBQSxDQUFBLFFBQUEsR0FBQSxJQUFBLFlBQUEsQ0FBQTtBQUNBLFdBQUEsRUFBQSxvQkFBQTtLQUNBLENBQUEsQ0FBQTtBQUNBLFlBQUEsQ0FBQSxPQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0EsWUFBQSxFQUFBLGFBQUE7QUFDQSxVQUFBLEVBQUEsWUFBQSxJQUFBLDJCQUFBLE9BQUEsRUFBQTtBQUNBLGdCQUFBLElBQUEsR0FBQSxHQUFBLEdBQUEsSUFBQSxDQUFBLElBQUEsQ0FBQSxLQUFBLENBQUEsSUFBQSxDQUFBLElBQUEsQ0FBQSxXQUFBLENBQUEsR0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLEdBQUEsR0FBQSxDQUFBO0FBQ0EsbUJBQUEsd0JBQUEsQ0FBQSxPQUFBLENBQUEsSUFBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBLENBQUE7U0FDQTtLQUNBLENBQUEsQ0FBQTtBQUNBLFlBQUEsQ0FBQSxzQkFBQSxHQUFBLFVBQUEsSUFBQSwyQkFBQSxNQUFBLEVBQUEsT0FBQSxFQUFBO0FBQ0EsZUFBQSxDQUFBLElBQUEsQ0FBQSx3QkFBQSxFQUFBLElBQUEsRUFBQSxNQUFBLEVBQUEsT0FBQSxDQUFBLENBQUE7S0FDQSxDQUFBO0FBQ0EsWUFBQSxDQUFBLGlCQUFBLEdBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxlQUFBLENBQUEsSUFBQSxDQUFBLG1CQUFBLEVBQUEsUUFBQSxDQUFBLENBQUE7S0FDQSxDQUFBO0FBQ0EsWUFBQSxDQUFBLGdCQUFBLEdBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxlQUFBLENBQUEsSUFBQSxDQUFBLGtCQUFBLEVBQUEsY0FBQSxDQUFBLENBQUE7S0FDQSxDQUFBO0FBQ0EsWUFBQSxDQUFBLGtCQUFBLEdBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxlQUFBLENBQUEsSUFBQSxDQUFBLG9CQUFBLEVBQUEsSUFBQSxDQUFBLENBQUE7S0FDQSxDQUFBO0FBQ0EsWUFBQSxDQUFBLGNBQUEsR0FBQSxVQUFBLFFBQUEsRUFBQSxRQUFBLEVBQUE7QUFDQSxlQUFBLENBQUEsSUFBQSxDQUFBLGdCQUFBLEVBQUEsUUFBQSxFQUFBLFFBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtBQUNBLFlBQUEsQ0FBQSxhQUFBLEdBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxlQUFBLENBQUEsSUFBQSxDQUFBLGVBQUEsRUFBQSxRQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7QUFDQSxZQUFBLENBQUEsYUFBQSxHQUFBLFVBQUEsUUFBQSxFQUFBLFFBQUEsRUFBQSxNQUFBLEVBQUEsT0FBQSxFQUFBO0FBQ0EsZUFBQSxDQUFBLElBQUEsQ0FBQSxlQUFBLEVBQUEsUUFBQSxFQUFBLFFBQUEsRUFBQSxNQUFBLEVBQUEsT0FBQSxDQUFBLENBQUE7S0FDQSxDQUFBO0FBQ0EsWUFBQSxDQUFBLFdBQUEsR0FBQSxVQUFBLFFBQUEsRUFBQSxRQUFBLEVBQUEsTUFBQSxFQUFBLE9BQUEsRUFBQTtBQUNBLGVBQUEsQ0FBQSxJQUFBLENBQUEsYUFBQSxFQUFBLFFBQUEsRUFBQSxRQUFBLEVBQUEsTUFBQSxFQUFBLE9BQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtBQUNBLFlBQUEsQ0FBQSxZQUFBLEdBQUEsVUFBQSxRQUFBLEVBQUEsUUFBQSxFQUFBLE1BQUEsRUFBQSxPQUFBLEVBQUE7QUFDQSxlQUFBLENBQUEsSUFBQSxDQUFBLGNBQUEsRUFBQSxRQUFBLEVBQUEsUUFBQSxFQUFBLE1BQUEsRUFBQSxPQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7QUFDQSxZQUFBLENBQUEsY0FBQSxHQUFBLFVBQUEsUUFBQSxFQUFBLFFBQUEsRUFBQSxNQUFBLEVBQUEsT0FBQSxFQUFBO0FBQ0EsZUFBQSxDQUFBLElBQUEsQ0FBQSxnQkFBQSxFQUFBLFFBQUEsRUFBQSxRQUFBLEVBQUEsTUFBQSxFQUFBLE9BQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtBQUNBLFlBQUEsQ0FBQSxhQUFBLEdBQUEsWUFBQTtBQUNBLGVBQUEsQ0FBQSxJQUFBLENBQUEsZUFBQSxDQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsTUFBQSxFQUFBLENBQUE7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDN0NBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsU0FBQTtBQUNBLG1CQUFBLEVBQUEsY0FBQTtBQUNBLGtCQUFBLEVBQUEsV0FBQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLENBQUEsVUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFNBQUE7QUFDQSxtQkFBQSxFQUFBLGtCQUFBO0FBQ0Esa0JBQUEsRUFBQSxXQUFBO0tBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQUdBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxjQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsU0FBQTtBQUNBLG1CQUFBLEVBQUEscUJBQUE7QUFDQSxrQkFBQSxFQUFBLGlCQUFBO0tBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQ3ZCQSxHQUFBLENBQUEsT0FBQSxDQUFBLGVBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsUUFBQSxFQUFBOztBQUdBLFFBQUEsVUFBQSxHQUFBLFNBQUEsVUFBQSxDQUFBLE9BQUEsRUFBQTtBQUNBLFlBQUEsUUFBQSxHQUFBLE9BQUEsQ0FBQSxPQUFBLENBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO0FBQ0EsaUJBQUEsQ0FBQSxJQUFBLENBQUE7QUFDQSxrQkFBQSxFQUFBLFFBQUE7QUFDQSxvQkFBQSxFQUNBLGtEQUFBLEdBQ0EsdUJBQUEsR0FDQSxPQUFBLEdBQ0Esd0JBQUEsR0FDQSxjQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFHQSxXQUFBO0FBQ0EsZUFBQSxFQUFBLGlCQUFBLE9BQUEsRUFBQSxPQUFBLEVBQUE7QUFDQSxzQkFBQSxDQUFBLE9BQUEsQ0FBQSxDQUFBO0FBQ0Esb0JBQUEsQ0FBQSxZQUFBO0FBQ0EseUJBQUEsQ0FBQSxJQUFBLEVBQUEsQ0FBQTthQUNBLEVBQUEsT0FBQSxDQUFBLENBQUE7U0FDQTtLQUNBLENBQUE7Q0FJQSxDQUFBLENBQUE7Ozs7Ozs7QUM1QkEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxRQUFBLEVBQUEsVUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUE7O0FBRUEsV0FBQTtBQUNBLGdCQUFBLEVBQUEsR0FBQTtBQUNBLGFBQUEsRUFBQSxFQUFBO0FBQ0EsbUJBQUEsRUFBQSxjQUFBO0FBQ0EsWUFBQSxFQUFBLGNBQUEsS0FBQSxFQUFBOztBQUVBLGlCQUFBLENBQUEsS0FBQSxHQUFBLENBQ0EsRUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUEsRUFDQSxFQUFBLEtBQUEsRUFBQSxRQUFBLEVBQUEsS0FBQSxFQUFBLFFBQUEsRUFBQSxFQUNBLEVBQUEsS0FBQSxFQUFBLFFBQUEsRUFBQSxLQUFBLEVBQUEsUUFBQSxFQUFBLEVBQ0EsRUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsQ0FDQSxDQUFBOztBQUVBLGlCQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxpQkFBQSxDQUFBLFVBQUEsR0FBQSxZQUFBO0FBQ0EsdUJBQUEsV0FBQSxDQUFBLGVBQUEsRUFBQSxDQUFBO2FBQ0EsQ0FBQTs7QUFFQSxpQkFBQSxDQUFBLE1BQUEsR0FBQSxZQUFBO0FBQ0EsMkJBQUEsQ0FBQSxNQUFBLEVBQUEsQ0FBQSxJQUFBLENBQUEsWUFBQTtBQUNBLDBCQUFBLENBQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQSxDQUFBO2lCQUNBLENBQUEsQ0FBQTthQUNBLENBQUE7O0FBRUEsZ0JBQUEsT0FBQSxHQUFBLFNBQUEsT0FBQSxHQUFBO0FBQ0EsMkJBQUEsQ0FBQSxlQUFBLEVBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSx5QkFBQSxDQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7aUJBQ0EsQ0FBQSxDQUFBO2FBQ0EsQ0FBQTs7QUFFQSxnQkFBQSxVQUFBLEdBQUEsU0FBQSxVQUFBLEdBQUE7QUFDQSxxQkFBQSxDQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBOztBQUVBLG1CQUFBLEVBQUEsQ0FBQTs7QUFFQSxzQkFBQSxDQUFBLEdBQUEsQ0FBQSxXQUFBLENBQUEsWUFBQSxFQUFBLE9BQUEsQ0FBQSxDQUFBO0FBQ0Esc0JBQUEsQ0FBQSxHQUFBLENBQUEsV0FBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLENBQUEsQ0FBQTtBQUNBLHNCQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxjQUFBLEVBQUEsVUFBQSxDQUFBLENBQUE7U0FFQTs7S0FFQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOztBQy9DQSxHQUFBLENBQUEsU0FBQSxDQUFBLFdBQUEsRUFBQSxVQUFBLGFBQUEsRUFBQTtBQUNBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLEdBQUE7QUFDQSxtQkFBQSxFQUFBLDRDQUFBO0FBQ0EsWUFBQSxFQUFBLGNBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUE7QUFDQSxpQkFBQSxDQUFBLFNBQUEsR0FBQSxZQUFBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsT0FBQSxFQUFBLEtBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQTtBQUNBLDZCQUFBLENBQUEsU0FBQSxDQUFBLEtBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQTthQUNBLENBQUE7U0FDQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUEiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcbndpbmRvdy5hcHAgPSBhbmd1bGFyLm1vZHVsZSgnRnVsbHN0YWNrR2VuZXJhdGVkQXBwJywgWydmc2FQcmVCdWlsdCcsJ2Jvb3RzdHJhcExpZ2h0Ym94JywgJ3VpLnJvdXRlcicsICd1aS5ib290c3RyYXAnLCAnbmdBbmltYXRlJywgJ2FuZ3VsYXJGaWxlVXBsb2FkJywgJ25nTWF0ZXJpYWwnXSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgICAvLyBUaGlzIHR1cm5zIG9mZiBoYXNoYmFuZyB1cmxzICgvI2Fib3V0KSBhbmQgY2hhbmdlcyBpdCB0byBzb21ldGhpbmcgbm9ybWFsICgvYWJvdXQpXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuICAgIC8vIElmIHdlIGdvIHRvIGEgVVJMIHRoYXQgdWktcm91dGVyIGRvZXNuJ3QgaGF2ZSByZWdpc3RlcmVkLCBnbyB0byB0aGUgXCIvXCIgdXJsLlxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcbn0pO1xuXG4vLyBUaGlzIGFwcC5ydW4gaXMgZm9yIGNvbnRyb2xsaW5nIGFjY2VzcyB0byBzcGVjaWZpYyBzdGF0ZXMuXG5hcHAucnVuKGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxuICAgIHZhciBkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5kYXRhICYmIHN0YXRlLmRhdGEuYXV0aGVudGljYXRlO1xuICAgIH07XG5cbiAgICAvLyAkc3RhdGVDaGFuZ2VTdGFydCBpcyBhbiBldmVudCBmaXJlZFxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMpIHtcblxuICAgICAgICBpZiAoIWRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgodG9TdGF0ZSkpIHtcbiAgICAgICAgICAgIC8vIFRoZSBkZXN0aW5hdGlvbiBzdGF0ZSBkb2VzIG5vdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICAvLyBUaGUgdXNlciBpcyBhdXRoZW50aWNhdGVkLlxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbmNlbCBuYXZpZ2F0aW5nIHRvIG5ldyBzdGF0ZS5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAvLyBJZiBhIHVzZXIgaXMgcmV0cmlldmVkLCB0aGVuIHJlbmF2aWdhdGUgdG8gdGhlIGRlc3RpbmF0aW9uXG4gICAgICAgICAgICAvLyAodGhlIHNlY29uZCB0aW1lLCBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSB3aWxsIHdvcmspXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UsIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLCBnbyB0byBcImxvZ2luXCIgc3RhdGUuXG4gICAgICAgICAgICAvLyRyb290U2NvcGUubG9nZ2VkSW5Vc2VyID0gdXNlcjtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCd1c2VyIGZyb20gYXBwJywgdXNlcilcbiAgICAgICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKHRvU3RhdGUubmFtZSwgdG9QYXJhbXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbn0pO1xuIiwiYXBwLmNvbnRyb2xsZXIoXCJBZG1pbkN0cmxcIiwgKCRzY29wZSwgJHN0YXRlLCBBZG1pbkZhY3RvcnksIEFsYnVtRmFjdG9yeSwgUGhvdG9zRmFjdG9yeSkgPT4ge1xuICAgICRzY29wZS5hZGRpbmdQaWN0dXJlcyA9IGZhbHNlO1xuXG4gICAgQWxidW1GYWN0b3J5LmZldGNoQWxsKClcbiAgICAgICAgLnRoZW4oYWxidW1zID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdmZXRjaGVkJywgYWxidW1zKTtcbiAgICAgICAgICAgICRzY29wZS5hbGJ1bXMgPSBhbGJ1bXM7XG4gICAgICAgICAgICAkc2NvcGUuYWxidW1PbmUgPSAkc2NvcGUuYWxidW1zWzBdO1xuICAgICAgICB9KTtcblxuICAgIFBob3Rvc0ZhY3RvcnkuZmV0Y2hUZW4oKVxuICAgICAgICAudGhlbihwaG90b3MgPT4ge1xuICAgICAgICAgICAgJHNjb3BlLnBob3RvcyA9IHBob3RvcztcbiAgICAgICAgfSk7XG5cbiAgICAkc2NvcGUuZGVsZXRlQWxidW0gPSAoYWxidW0pID0+IHtcbiAgICAgICAgQWxidW1GYWN0b3J5LmRlbGV0ZUFsYnVtKGFsYnVtLl9pZCk7XG4gICAgICAgIGxldCBhbGJ1bUluZGV4ID0gJHNjb3BlLmFsYnVtcy5pbmRleE9mKGFsYnVtKTtcbiAgICAgICAgJHNjb3BlLmFsYnVtcy5zcGxpY2UoYWxidW1JbmRleCwgMSk7XG4gICAgfVxuXG4gICAgJHNjb3BlLmNyZWF0ZUFsYnVtID0gKCkgPT4ge1xuICAgICAgICBsZXQgYWxidW0gPSB7XG4gICAgICAgICAgICB0aXRsZTogJHNjb3BlLm5ld0FsYnVtXG4gICAgICAgIH1cbiAgICAgICAgQWxidW1GYWN0b3J5LmNyZWF0ZUFsYnVtKGFsYnVtKS50aGVuKGFsYnVtID0+IHtcbiAgICAgICAgICAgICRzY29wZS5hbGJ1bXMucHVzaChhbGJ1bSk7XG4gICAgICAgICAgICAkc2NvcGUubmV3QWxidW0gPSBcIlwiO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgICRzY29wZS5hZGRQaG90b3MgPSAoYWxidW0pID0+IHtcbiAgICAgICAgJHNjb3BlLnNlbGVjdGluZ1BpY3R1cmVzID0gdHJ1ZTtcbiAgICAgICAgJHNjb3BlLmN1cnJlbnRBbGJ1bSA9IGFsYnVtO1xuICAgICAgICBQaG90b3NGYWN0b3J5LmZldGNoQWxsKClcbiAgICAgICAgICAgIC50aGVuKHBob3RvcyA9PiB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnBob3RvcyA9IHBob3RvcztcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgICRzY29wZS52aWV3QWxidW0gPSAoYWxidW0pID0+IHtcbiAgICBcdCRzdGF0ZS5nbygnc2luZ2xlQWxidW0nLCB7YWxidW1JZDogYWxidW0uX2lkfSlcbiAgICB9XG5cblxuICAgICRzY29wZS51cGRhdGVBbGJ1bSA9ICgpID0+IHtcbiAgICAgICAgQWxidW1GYWN0b3J5LnVwZGF0ZUFsYnVtKCRzY29wZS5jdXJyZW50QWxidW0pLnRoZW4ocmVzID0+IHtcbiAgICAgICAgXHQkc3RhdGUucmVsb2FkKCk7XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgJHNjb3BlLnVwbG9hZFBob3RvcyA9ICgpID0+IHtcbiAgICAgICAgJHN0YXRlLmdvKCd1cGxvYWRQaG90b3MnKTtcbiAgICB9XG5cbiAgICAkc2NvcGUuYWRkVG9BbGJ1bSA9IChwaG90bykgPT4ge1xuICAgICAgICAkc2NvcGUuY3VycmVudEFsYnVtLnBob3Rvcy5wdXNoKHBob3RvLl9pZCk7XG4gICAgfVxufSkiLCJhcHAuZmFjdG9yeShcIkFkbWluRmFjdG9yeVwiLCAoJGh0dHApID0+IHtcblx0cmV0dXJuIHtcblx0XHRcblx0fVxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4nLCB7XG4gICAgICAgIHVybDogJy9hZG1pbicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL2FkbWluLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnQWxidW1DdHJsJ1xuICAgIH0pO1xufSk7IiwiYXBwLmNvbnRyb2xsZXIoJ0FsYnVtQ3RybCcsICgkc2NvcGUsICR0aW1lb3V0LCAkc3RhdGUsIEFkbWluRmFjdG9yeSwgQWxidW1GYWN0b3J5LCBQaG90b3NGYWN0b3J5LCBEaWFsb2dGYWN0b3J5KSA9PiB7XG4gICAgJHNjb3BlLmFkZGluZ1BpY3R1cmVzID0gZmFsc2U7XG5cbiAgICBBbGJ1bUZhY3RvcnkuZmV0Y2hBbGwoKVxuICAgICAgICAudGhlbihhbGJ1bXMgPT4ge1xuICAgICAgICAgICAgJHNjb3BlLmFsYnVtcyA9IGFsYnVtcztcbiAgICAgICAgICAgICRzY29wZS5hbGJ1bU9uZSA9ICRzY29wZS5hbGJ1bXNbMF07XG4gICAgICAgIH0pO1xuXG4gICAgUGhvdG9zRmFjdG9yeS5mZXRjaFRlbigpXG4gICAgICAgIC50aGVuKHBob3RvcyA9PiB7XG4gICAgICAgICAgICAkc2NvcGUucGhvdG9zID0gcGhvdG9zO1xuICAgICAgICB9KTtcblxuICAgICRzY29wZS5kZWxldGVBbGJ1bSA9IChhbGJ1bSkgPT4ge1xuICAgICAgICBBbGJ1bUZhY3RvcnkuZGVsZXRlQWxidW0oYWxidW0uX2lkKTtcbiAgICAgICAgbGV0IGFsYnVtSW5kZXggPSAkc2NvcGUuYWxidW1zLmluZGV4T2YoYWxidW0pO1xuICAgICAgICAkc2NvcGUuYWxidW1zLnNwbGljZShhbGJ1bUluZGV4LCAxKTtcbiAgICB9XG5cbiAgICAkc2NvcGUuY3JlYXRlQWxidW0gPSAoKSA9PiB7XG4gICAgICAgIGxldCBhbGJ1bSA9IHtcbiAgICAgICAgICAgIHRpdGxlOiAkc2NvcGUubmV3QWxidW1cbiAgICAgICAgfVxuICAgICAgICBBbGJ1bUZhY3RvcnkuY3JlYXRlQWxidW0oYWxidW0pLnRoZW4oYWxidW0gPT4ge1xuICAgICAgICAgICAgJHNjb3BlLmFsYnVtcy5wdXNoKGFsYnVtKTtcbiAgICAgICAgICAgICRzY29wZS5uZXdBbGJ1bSA9IFwiXCI7XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgJHNjb3BlLmFkZFBob3RvcyA9IChhbGJ1bSkgPT4ge1xuICAgICAgICAkc2NvcGUuc2VsZWN0aW5nUGljdHVyZXMgPSB0cnVlO1xuICAgICAgICAkc2NvcGUuY3VycmVudEFsYnVtID0gYWxidW07XG4gICAgICAgIFBob3Rvc0ZhY3RvcnkuZmV0Y2hBbGwoKVxuICAgICAgICAgICAgLnRoZW4ocGhvdG9zID0+IHtcbiAgICAgICAgICAgICAgICAkc2NvcGUucGhvdG9zID0gcGhvdG9zO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgJHNjb3BlLnZpZXdBbGJ1bSA9IChhbGJ1bSkgPT4ge1xuXG4gICAgfVxuXG5cbiAgICAkc2NvcGUudXBkYXRlQWxidW0gPSAoKSA9PiB7XG4gICAgICAgIEFsYnVtRmFjdG9yeS51cGRhdGVBbGJ1bSgkc2NvcGUuY3VycmVudEFsYnVtKS50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICBEaWFsb2dGYWN0b3J5LmRpc3BsYXkoXCJVcGRhdGVkXCIsIDE1MDApO1xuICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLnJlbG9hZCgpO1xuICAgICAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgJHNjb3BlLnZpZXdBbGJ1bSA9IChhbGJ1bSkgPT4ge1xuICAgICAgICAkc3RhdGUuZ28oJ3NpbmdsZUFsYnVtJywge2FsYnVtSWQ6IGFsYnVtLl9pZH0pXG4gICAgfVxuXG4gICAgJHNjb3BlLmFkZFRvQWxidW0gPSAocGhvdG8pID0+IHtcbiAgICAgICAgJHNjb3BlLmN1cnJlbnRBbGJ1bS5waG90b3MucHVzaChwaG90by5faWQpO1xuICAgICAgICBEaWFsb2dGYWN0b3J5LmRpc3BsYXkoXCJBZGRlZFwiLCAxMDAwKTtcbiAgICB9XG5cblxuXG59KSIsImFwcC5mYWN0b3J5KCdBbGJ1bUZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGNyZWF0ZUFsYnVtOiAoYWxidW0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL2FsYnVtcy8nLCBhbGJ1bSkudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICAgIGZldGNoQWxsOiAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL2FsYnVtcy8nKVxuICAgICAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLmRhdGE7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9LFxuICAgICAgICB1cGRhdGVBbGJ1bTogKGFsYnVtKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9hbGJ1bXMvdXBkYXRlJywgYWxidW0pXG4gICAgICAgICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICAgIGZldGNoT25lOiAoYWxidW1JZCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9hbGJ1bXMvJysgYWxidW1JZClcbiAgICAgICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5kYXRhXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgYWRkUGhvdG86IChwaG90b0lkKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9hbGJ1bXMvcGhvdG8vJyArIHBob3RvSWQpXG4gICAgICAgICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXMuZGF0YVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGRlbGV0ZUFsYnVtOiAoYWxidW1JZCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmRlbGV0ZSgnL2FwaS9hbGJ1bXMvJysgYWxidW1JZClcbiAgICAgICAgfVxuICAgIH1cblxufSkiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhbGJ1bScsIHtcbiAgICAgICAgdXJsOiAnL0FsYnVtJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hbGJ1bS9hbGJ1bS5odG1sJ1xuXG4gICAgfSk7XG59KTtcblxuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaW5nbGVBbGJ1bScsIHtcbiAgICAgICAgdXJsOiAnL0FsYnVtLzphbGJ1bUlkJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvc2luZ2xlLWFsYnVtLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnU2luZ2xlQWxidW1DdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdGFsYnVtOiAoQWxidW1GYWN0b3J5LCAkc3RhdGVQYXJhbXMpID0+IHtcbiAgICAgICAgXHRcdHJldHVybiBBbGJ1bUZhY3RvcnkuZmV0Y2hPbmUoJHN0YXRlUGFyYW1zLmFsYnVtSWQpXG4gICAgICAgIFx0fVxuICAgICAgICB9XG4gICAgICBcbiAgICB9KTtcbn0pO1xuIiwiYXBwLmNvbnRyb2xsZXIoJ0FsYnVtc0N0cmwnLCAoJHNjb3BlLCAkc3RhdGUsIFBob3Rvc0ZhY3RvcnksIEFsYnVtRmFjdG9yeSkgPT4ge1xuXHRBbGJ1bUZhY3RvcnkuZmV0Y2hBbGwoKVxuICAgICAgICAudGhlbihhbGJ1bXMgPT4ge1xuICAgICAgICAgICAgJHNjb3BlLmFsYnVtcyA9IGFsYnVtcztcbiAgICAgICAgICAgICRzY29wZS5hbGJ1bU9uZSA9ICRzY29wZS5hbGJ1bXNbMF07XG4gICAgICAgIH0pO1xuXG4gICAgJHNjb3BlLnZpZXdBbGJ1bSA9IChhbGJ1bSkgPT4ge1xuICAgICAgICAkc3RhdGUuZ28oJ3NpbmdsZUFsYnVtJywge2FsYnVtSWQ6IGFsYnVtLl9pZH0pXG4gICAgfVxuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhbGJ1bXMnLCB7XG4gICAgICAgIHVybDogJy9hbGJ1bXMnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJy9hbGJ1bXMuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdBbGJ1bXNDdHJsJ1xuICAgIH0pO1xufSk7IiwiYXBwLmNvbmZpZygoJHN0YXRlUHJvdmlkZXIpID0+IHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ25ld0FsYnVtJywge1xuXHRcdHVybDogJy9uZXdBbGJ1bScsXG5cdFx0dGVtcGxhdGVVcmw6ICcvbmV3LWFsYnVtLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdOZXdBbGJ1bUN0cmwnXG5cdH0pXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ05ld0FsYnVtQ3RybCcsICgkc3RhdGUsIEFsYnVtRmFjdG9yeSwgUGhvdG9zRmFjdG9yeSwgRGlhbG9nRmFjdG9yeSkgPT4ge1xuXHQkc2NvcGUuY3JlYXRlQWxidW0gPSAoKSA9PiB7XG4gICAgICAgIGxldCBhbGJ1bSA9IHtcbiAgICAgICAgICAgIHRpdGxlOiAkc2NvcGUubmV3QWxidW1cbiAgICAgICAgfVxuICAgICAgICBBbGJ1bUZhY3RvcnkuY3JlYXRlQWxidW0oYWxidW0pLnRoZW4oYWxidW0gPT4ge1xuICAgICAgICBcdERpYWxvZ0ZhY3RvcnkuZGlzcGxheShcIkNyZWF0ZWRcIik7XG4gICAgICAgIH0pXG4gICAgfVxufSk7IiwiYXBwLmNvbnRyb2xsZXIoJ1NpbmdsZUFsYnVtQ3RybCcsICgkc2NvcGUsICR0aW1lb3V0LCAkc3RhdGUsIGFsYnVtLCBBZG1pbkZhY3RvcnksIEFsYnVtRmFjdG9yeSwgUGhvdG9zRmFjdG9yeSkgPT4ge1xuXHQkc2NvcGUuYWxidW0gPSBhbGJ1bTtcblx0JHNjb3BlLnNlbGVjdGluZ0NvdmVyID0gZmFsc2U7XG5cdCRzY29wZS5yZW1vdmVGcm9tQWxidW0gPSAocGhvdG8pID0+IHtcblx0XHRsZXQgcGhvdG9JbmRleCA9ICRzY29wZS5hbGJ1bS5waG90b3MuaW5kZXhPZihwaG90byk7XG5cdFx0JHNjb3BlLmFsYnVtLnBob3Rvcy5zcGxpY2UocGhvdG9JbmRleCwgMSk7XG5cdH1cblxuXHQkc2NvcGUuc2VsZWN0Q292ZXIgPSAoKSA9PiB7XG5cdFx0JHRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0JHNjb3BlLnNlbGVjdGluZ0NvdmVyID0gdHJ1ZTtcblx0XHR9LCA1MDApO1xuXHR9XG5cblx0JHNjb3BlLmFkZENvdmVyID0gKHBob3RvKSA9PiB7XG4gICAgICAgICRzY29wZS5hbGJ1bS5jb3ZlciA9IHBob3RvLl9pZDtcbiAgICAgICAgJHNjb3BlLnNlbGVjdGluZ0NvdmVyID0gZmFsc2U7XG4gICAgfVxuXG5cdCRzY29wZS51cGRhdGVBbGJ1bSA9ICgpID0+IHtcbiAgICAgICAgQWxidW1GYWN0b3J5LnVwZGF0ZUFsYnVtKCRzY29wZS5hbGJ1bSkudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdhZG1pbicpO1xuICAgICAgICB9KVxuICAgIH1cbn0pOyIsIi8vaHRtbDogY2hhdCBpbiBDaGF0QXJyXG4vL2NoYXQudXNlcm5hbWUgLCBjaGF0LmRhdGVcblxuXG52YXIgY2xpZW50U29ja2V0ID0gaW8od2luZG93LmxvY2F0aW9uLm9yaWdpbik7XG5jbGllbnRTb2NrZXQub24oJ2Nvbm5lY3QnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgLy90aGlzIGxvZ3NcbiAgICAgICAgLy9jb25zb2xlLmxvZygnQ29ubmVjdGVkIHRvIHNlcnZlcicpO1xuICAgIH0pO1xuXG5hcHAuY29udHJvbGxlcignQ2hhdENvbnRyb2xsZXInLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkbG9jYXRpb24sICRhbmNob3JTY3JvbGwsIENoYXRGYWN0b3J5LCBDaGF0Um9vbSkge1xuICAgICRzY29wZS5jaGF0QXJyID0gW107XG4gICAgJHNjb3BlLnRleHQgPSBcIlwiO1xuICAgIFxuXG5cbiAgICAkc2NvcGUuaW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAvL0dldCB0aGUgY3VycmVudCB1c2VyLCBzZXQgdG8gR3Vlc3QgaWYgIVVzZXJcbiAgICAgICAgQ2hhdEZhY3RvcnkuZ2V0VXNlcigpLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgICBpZihyZXMpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuY3VycmVudFVzZXIgPSByZXMudXNlcm5hbWU7XG4gICAgICAgICAgICAgICAgQ2hhdFJvb20udXNlckpvaW4oJHNjb3BlLmN1cnJlbnRVc2VyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICRzY29wZS5jdXJyZW50VXNlciA9IFwiR3Vlc3RcIjtcbiAgICAgICAgICAgICAgICAkc2NvcGUuY3VycmVudFVzZXIudXNlcm5hbWUgPSBcIkd1ZXN0XCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgIENoYXRGYWN0b3J5LnJlY2VudENoYXQoKS50aGVuKGZ1bmN0aW9uKHRvcENoYXRzKSB7XG4gICAgICAgICAgICAkc2NvcGUuY2hhdEFyciA9IHRvcENoYXRzO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgXG5cbiAgICAkc2NvcGUuaW5pdCgpO1xuXG5cblxuICAgIC8vICRzY29wZS5sb2FkVGV4dHMgPSBmdW5jdGlvbigpIHtcblxuICAgIC8vICAgICAkc2NvcGUudGV4dHNMb2FkZWQgPSB0cnVlO1xuICAgIC8vICAgICAkc2NvcGUud2VsY29tZU1zZyA9IHRydWU7XG4gICAgLy8gICAgIENoYXRGYWN0b3J5LmxvYWQoKVxuICAgIC8vICAgICAgICAgLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuICAgIC8vICAgICAgICAgICAgIGRhdGEuZm9yRWFjaChmdW5jdGlvbih0ZXh0RGF0YSkge1xuICAgIC8vICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygndGV4dCBkYXRhIGZyb20gZGInLCB0ZXh0RGF0YSlcblxuICAgIC8vICAgICAgICAgICAgICAgICAkc2NvcGUuY2hhdEFyci5wdXNoKHRleHREYXRhKTtcbiAgICAvLyAgICAgICAgICAgICB9KTtcbiAgICAvLyAgICAgICAgIH0pXG4gICAgLy8gfVxuXG5cbiAgICAkc2NvcGUuc3VibWl0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vJGxvY2F0aW9uLmhhc2goJ2NoYXRCdWJibGVzJyk7XG4gICAgICAgIGlmICgkc2NvcGUudGV4dCkge1xuICAgICAgICAgICAgdmFyIGFkZFRleHQgPSB7XG4gICAgICAgICAgICAgICAgY29udGVudDogdGhpcy50ZXh0LFxuICAgICAgICAgICAgICAgIHVzZXJuYW1lOiAkc2NvcGUuY3VycmVudFVzZXJcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAkc2NvcGUuYnViYmxlU3R5bGUgPSB0cnVlO1xuICAgICAgICAgICAgJHNjb3BlLmxvZ0NoYXQoYWRkVGV4dCwgdHJ1ZSk7XG4gICAgICAgICAgICAvLyRzY29wZS5jaGF0QXJyLnB1c2goYWRkVGV4dCk7XG4gICAgICAgICAgICAvL2Fsc28gY2FsbGluZyBwdXNoIGluIGxvZyBjaGF0XG4gICAgICAgICAgICAkc2NvcGUudGV4dCA9IFwiXCI7XG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICAkc2NvcGUubG9nQ2hhdCA9IGZ1bmN0aW9uKGRhdGEsIHNob3VsZEJyb2FkY2FzdCkge1xuICAgICAgICBDaGF0RmFjdG9yeS5zZW5kQ2hhdChkYXRhKS50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgICAgJHNjb3BlLmNoYXRBcnIucHVzaChyZXMpO1xuICAgICAgICAgICAgaWYgKHNob3VsZEJyb2FkY2FzdCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdwcmVwYXJpbmcgdG8gZW1pdCcsIHJlcylcbiAgICAgICAgICAgICAgICBDaGF0Um9vbS5lbWl0Q2hhdChyZXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAkc2NvcGUuc2hvd0NoYXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNjb3BlLmNoYXRMb2dpbiA9IHRydWU7XG4gICAgfVxuICAgICRzY29wZS5yb3dDbGFzcyA9IGZ1bmN0aW9uKHVzZXJuYW1lKSB7XG4gICAgICAgIGlmKHVzZXJuYW1lID09PSAkc2NvcGUuY3VycmVudFVzZXIpIHtcbiAgICAgICAgICAgIHJldHVybiAnbGVmdCdcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHJldHVybiAncmlnaHQnXG4gICAgfVxuICAgIGNsaWVudFNvY2tldC5vbignc2VydmVyQ2hhdCcsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2NoYXQgcmVjaWV2ZWQgZnJvbSBzZXJ2ZXInLCBkYXRhKTtcbiAgICAgICAgaWYoZGF0YS51c2VybmFtZSAhPT0gJHNjb3BlLmN1cnJlbnRVc2VyKXtcbiAgICAgICAgICAgICRzY29wZS5jaGF0QXJyLnB1c2goZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgJHNjb3BlLnNjcm9sbEJvdHRvbSgpXG4gICAgICAgICRzY29wZS4kZGlnZXN0KClcbiAgICAgICAgLy8kc2NvcGUuY2hhdEFyci5wdXNoKHJlcyk7XG4gICAgfSlcblxuXG4gICAgJHNjb3BlLnNjcm9sbEJvdHRvbSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcInNjcm9sbGluZyB0byBib3R0b21cIik7XG4gICAgICAgICRzY29wZS5zY3JvbGxCb3gucHJvcCgnb2Zmc2V0VG9wJyk7XG4gICAgICAgIC8vIHZhciBjb250YWluZXJIZWlnaHQgPSBjb250YWluZXIuY2xpZW50SGVpZ2h0O1xuICAgICAgICAvLyB2YXIgY29udGVudEhlaWdodCA9IGNvbnRhaW5lci5zY3JvbGxIZWlnaHQ7XG5cbiAgICAgICAgLy8gY29udGFpbmVyLnNjcm9sbFRvcCA9IGNvbnRlbnRIZWlnaHQgLSBjb250YWluZXJIZWlnaHQ7XG4gICAgfVxuXG4gICAgLy8gY2hhdFNvY2tldC5vbignYnJvYWRjYXN0Q2hhdCcsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAvLyAgICAgJHNjb3BlLmxvZ0NoYXQoZGF0YSlcbiAgICAvLyB9KVxuXG5cbn0pIiwidmFyIGNoYXRTb2NrZXQgPSBpbyh3aW5kb3cubG9jYXRpb24ub3JpZ2luKTtcblxuY2hhdFNvY2tldC5vbignY29ubmVjdCcsIGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdDb25uZWN0ZWQgdG8gc2VydmVyJyk7XG59KTtcblxuY2hhdFNvY2tldC5vbignbmV3Q2hhdCcsIGZ1bmN0aW9uKCkge1xuXG59KVxuXG5hcHAuZmFjdG9yeSgnQ2hhdFJvb20nLCBmdW5jdGlvbigkaHR0cCkge1xuICAgIHZhciBDaGF0Um9vbSA9IHt9O1xuXG4gICAgQ2hhdFJvb20uc29ja2V0ID0gaW8od2luZG93LmxvY2F0aW9uLm9yaWdpbik7XG5cbiAgICBDaGF0Um9vbS5zb2NrZXQub24oJ2Nvbm5lY3QnLCBmdW5jdGlvbihjbGllbnQpIHtcbiAgICBcdGNvbnNvbGUubG9nKFwiY29ubmVjdGVkIGNsaWVudFwiLCBjbGllbnQpO1xuICAgIH0pXG5cbiAgICBDaGF0Um9vbS5zb2NrZXQub24oJ2dsb2JhbENsaWVudCcsIGZ1bmN0aW9uKGNsaWVudCkge1xuICAgIFx0Y29uc29sZS5sb2coXCJuZXcgZ2xvYmFsIGNsaWVudCFcIiwgY2xpZW50KTtcblxuICAgIH0pXG4gICAgQ2hhdFJvb20uZW1pdENoYXQgPSBmdW5jdGlvbihjb250ZW50cykge1xuICAgIFx0Y29uc29sZS5sb2coJ3NlbmRpbmcgY2hhdCcsIGNvbnRlbnRzKTtcbiAgICBcdENoYXRSb29tLnNvY2tldC5lbWl0KCdlbWl0Q2hhdCcsIGNvbnRlbnRzKVxuICAgIH1cbiAgICBDaGF0Um9vbS51c2VySm9pbiA9IGZ1bmN0aW9uKHVzZXIpIHtcbiAgICBcdENoYXRSb29tLnNvY2tldC5lbWl0KCd1c2VySm9pbicsIHVzZXIpXG4gICAgfVxuICAgXG5cbiAgICByZXR1cm4gQ2hhdFJvb207XG5cbn0pXG5cbiIsImFwcC5mYWN0b3J5KCdDaGF0RmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCAkcm9vdFNjb3BlLCBBdXRoU2VydmljZSkge1xuICAgIHZhciBDaGF0RmFjdG9yeSA9IHt9XG5cbiAgICBcblxuICAgIENoYXRGYWN0b3J5LnNlbmRDaGF0ID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICByZXR1cm4gJGh0dHAucG9zdChcIi9hcGkvY2hhdHNcIiwgZGF0YSkudGhlbihmdW5jdGlvbihjb250ZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnQuZGF0YVxuICAgICAgICAgICAgfSlcbiAgICB9XG5cbiAgICBDaGF0RmFjdG9yeS5sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAkaHR0cC5nZXQoXCIvYXBpL2NoYXRzXCIpLnRoZW4oZnVuY3Rpb24odGV4dERiKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygncmVjb3ZlcmVkIGNoYXRzJywgdGV4dERiLmRhdGEpO1xuICAgICAgICAgICAgcmV0dXJuIHRleHREYi5kYXRhO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgIENoYXRGYWN0b3J5LmdldFVzZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpO1xuICAgIH1cblxuICAgIENoYXRGYWN0b3J5LnJlY2VudENoYXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9jaGF0cy9yZWNlbnQnKS50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgIHJldHVybiBDaGF0RmFjdG9yeTtcblxuXG5cbn0pXG5cblxuLy8gcmV0dXJuIHtcblxuLy8gICAgIHNlbmRDaGF0OiBmdW5jdGlvbihkYXRhKSB7XG4vLyAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KFwiL2FwaS9jaGF0c1wiLCBkYXRhKVxuLy8gICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oY29udGVudCkge1xuLy8gICAgICAgICAgICAgICAgIHJldHVybiBjb250ZW50LmRhdGFcbi8vICAgICAgICAgICAgIH0pXG4vLyAgICAgfSxcblxuLy8gICAgIGxvYWQ6IGZ1bmN0aW9uKCkge1xuLy8gICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KFwiL2FwaS9jaGF0c1wiKS50aGVuKGZ1bmN0aW9uKHRleHREYikge1xuLy8gICAgICAgICAgICAgY29uc29sZS5sb2coJ3JlY292ZXJlZCBjaGF0cycsIHRleHREYi5kYXRhKTtcbi8vICAgICAgICAgICAgIHJldHVybiB0ZXh0RGIuZGF0YTtcbi8vICAgICAgICAgfSlcbi8vICAgICB9LFxuXG4vLyAgICAgZ2V0VXNlcjogZnVuY3Rpb24oKSB7XG4vLyAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKTtcbi8vICAgICB9LFxuXG4vLyAgICAgcmVjZW50Q2hhdDogZnVuY3Rpb24oKSB7XG4vLyAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvY2hhdHMvcmVjZW50JykudGhlbihmdW5jdGlvbihyZXMpIHtcbi8vICAgICAgICAgICAgIHJldHVybiByZXMuZGF0YTtcbi8vICAgICAgICAgfSlcbi8vICAgICB9XG4vLyB9XG5cblxuLy8gY29uc29sZS5sb2coJ2xvZ2dlZCBpbiB1c2VyJywgJHJvb3RTY29wZS5sb2dnZWRJblVzZXIpIC8vIGZyb20gYXBwLmpzXG4vLyBjb25zb2xlLmxvZygnb25saW5lIHVzZXInLCAkcm9vdFNjb3BlLm9ubGluZVVzZXIpIC8vIGZyb20gZnNhL3ByZS1idWlsZCIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NoYXQnLCB7XG4gICAgICAgIHVybDogJy9jaGF0JyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jaGF0L2NoYXQuaHRtbCcsXG4gICAgICBcbiAgICB9KTtcbn0pO1xuXG5cblxuXG4iLCIoZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gSG9wZSB5b3UgZGlkbid0IGZvcmdldCBBbmd1bGFyISBEdWgtZG95LlxuICAgIGlmICghd2luZG93LmFuZ3VsYXIpIHRocm93IG5ldyBFcnJvcignSSBjYW5cXCd0IGZpbmQgQW5ndWxhciEnKTtcblxuICAgIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZnNhUHJlQnVpbHQnLCBbXSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXdpbmRvdy5pbykgdGhyb3cgbmV3IEVycm9yKCdzb2NrZXQuaW8gbm90IGZvdW5kIScpO1xuICAgICAgICByZXR1cm4gd2luZG93LmlvKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pO1xuICAgIH0pO1xuXG4gICAgLy8gQVVUSF9FVkVOVFMgaXMgdXNlZCB0aHJvdWdob3V0IG91ciBhcHAgdG9cbiAgICAvLyBicm9hZGNhc3QgYW5kIGxpc3RlbiBmcm9tIGFuZCB0byB0aGUgJHJvb3RTY29wZVxuICAgIC8vIGZvciBpbXBvcnRhbnQgZXZlbnRzIGFib3V0IGF1dGhlbnRpY2F0aW9uIGZsb3cuXG4gICAgYXBwLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHtcbiAgICAgICAgbG9naW5TdWNjZXNzOiAnYXV0aC1sb2dpbi1zdWNjZXNzJyxcbiAgICAgICAgbG9naW5GYWlsZWQ6ICdhdXRoLWxvZ2luLWZhaWxlZCcsXG4gICAgICAgIGxvZ291dFN1Y2Nlc3M6ICdhdXRoLWxvZ291dC1zdWNjZXNzJyxcbiAgICAgICAgc2Vzc2lvblRpbWVvdXQ6ICdhdXRoLXNlc3Npb24tdGltZW91dCcsXG4gICAgICAgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyxcbiAgICAgICAgbm90QXV0aG9yaXplZDogJ2F1dGgtbm90LWF1dGhvcml6ZWQnXG4gICAgfSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xuICAgICAgICB2YXIgc3RhdHVzRGljdCA9IHtcbiAgICAgICAgICAgIDQwMTogQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCxcbiAgICAgICAgICAgIDQwMzogQVVUSF9FVkVOVFMubm90QXV0aG9yaXplZCxcbiAgICAgICAgICAgIDQxOTogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsXG4gICAgICAgICAgICA0NDA6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3Qoc3RhdHVzRGljdFtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGFwcC5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcbiAgICAgICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChbXG4gICAgICAgICAgICAnJGluamVjdG9yJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgkaW5qZWN0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGluamVjdG9yLmdldCgnQXV0aEludGVyY2VwdG9yJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKCRodHRwLCBTZXNzaW9uLCAkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUywgJHEpIHtcblxuICAgICAgICBmdW5jdGlvbiBvblN1Y2Nlc3NmdWxMb2dpbihyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgU2Vzc2lvbi5jcmVhdGUoZGF0YS5pZCwgZGF0YS51c2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEudXNlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVzZXMgdGhlIHNlc3Npb24gZmFjdG9yeSB0byBzZWUgaWYgYW5cbiAgICAgICAgLy8gYXV0aGVudGljYXRlZCB1c2VyIGlzIGN1cnJlbnRseSByZWdpc3RlcmVkLlxuICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIVNlc3Npb24udXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldExvZ2dlZEluVXNlciA9IGZ1bmN0aW9uIChmcm9tU2VydmVyKSB7XG5cbiAgICAgICAgICAgIC8vIElmIGFuIGF1dGhlbnRpY2F0ZWQgc2Vzc2lvbiBleGlzdHMsIHdlXG4gICAgICAgICAgICAvLyByZXR1cm4gdGhlIHVzZXIgYXR0YWNoZWQgdG8gdGhhdCBzZXNzaW9uXG4gICAgICAgICAgICAvLyB3aXRoIGEgcHJvbWlzZS4gVGhpcyBlbnN1cmVzIHRoYXQgd2UgY2FuXG4gICAgICAgICAgICAvLyBhbHdheXMgaW50ZXJmYWNlIHdpdGggdGhpcyBtZXRob2QgYXN5bmNocm9ub3VzbHkuXG5cbiAgICAgICAgICAgIC8vIE9wdGlvbmFsbHksIGlmIHRydWUgaXMgZ2l2ZW4gYXMgdGhlIGZyb21TZXJ2ZXIgcGFyYW1ldGVyLFxuICAgICAgICAgICAgLy8gdGhlbiB0aGlzIGNhY2hlZCB2YWx1ZSB3aWxsIG5vdCBiZSB1c2VkLlxuXG4gICAgICAgICAgICBpZiAodGhpcy5pc0F1dGhlbnRpY2F0ZWQoKSAmJiBmcm9tU2VydmVyICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLndoZW4oU2Vzc2lvbi51c2VyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTWFrZSByZXF1ZXN0IEdFVCAvc2Vzc2lvbi5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSB1c2VyLCBjYWxsIG9uU3VjY2Vzc2Z1bExvZ2luIHdpdGggdGhlIHJlc3BvbnNlLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIDQwMSByZXNwb25zZSwgd2UgY2F0Y2ggaXQgYW5kIGluc3RlYWQgcmVzb2x2ZSB0byBudWxsLlxuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL3Nlc3Npb24nKS50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9naW4gPSBmdW5jdGlvbiAoY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvbG9naW4nLCBjcmVkZW50aWFscylcbiAgICAgICAgICAgICAgICAudGhlbihvblN1Y2Nlc3NmdWxMb2dpbilcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHsgbWVzc2FnZTogJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJyB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9sb2dvdXQnKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBTZXNzaW9uLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9nb3V0U3VjY2Vzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ1Nlc3Npb24nLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMpIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgIHRoaXMudXNlciA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbiAoc2Vzc2lvbklkLCB1c2VyKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gc2Vzc2lvbklkO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gdXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IG51bGw7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxufSkoKTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICAgIHVybDogJy8nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJy9ob21lLmh0bWwnXG4gICAgfSk7XG59KTsiLCJhcHAuY29udHJvbGxlcignUGhvdG9DdHJsJywgKCRzY29wZSwgJHN0YXRlLCBQaG90b3NGYWN0b3J5LCBBbGJ1bUZhY3RvcnkpID0+IHtcbiAgICBsZXQgYWxidW1BcnJheSA9IFtdO1xuICAgICRzY29wZS50aXRsZSA9IFwiV2VsY29tZVwiO1xuICAgICRzY29wZS5waG90b3NHb3QgPSBmYWxzZTtcbiAgICAkc2NvcGUudXBsb2FkUGFnZSA9ICgpID0+IHtcbiAgICAgICAgJHN0YXRlLmdvKCdhZGRwaG90bycpO1xuICAgIH1cblxuICAgIEFsYnVtRmFjdG9yeS5mZXRjaEFsbCgpXG4gICAgICAgIC50aGVuKGFsYnVtcyA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZmV0Y2hlZCcsIGFsYnVtcyk7XG4gICAgICAgICAgICAkc2NvcGUuYWxidW1zID0gYWxidW1zO1xuICAgICAgICB9KVxuICAgIFBob3Rvc0ZhY3RvcnkuZmV0Y2hBbGwoKS50aGVuKHBob3RvcyA9PiB7XG4gICAgICAgICRzY29wZS5waG90b3MgPSBwaG90b3M7XG4gICAgfSlcblxuICAgICRzY29wZS5hZGRQaG90b3MgPSAoKSA9PiB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDw9IDQ0OyBpKyspIHtcbiAgICAgICAgICAgIGxldCBzcmMgPSAnL2ltYWdlL0lNR18nICsgaSArICcuanBnJztcbiAgICAgICAgICAgIFBob3Rvc0ZhY3RvcnkuYWRkUGhvdG8oc3JjKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgICRzY29wZS5mZXRjaEFsbCA9ICgpID0+IHtcbiAgICAgICAgUGhvdG9zRmFjdG9yeS5mZXRjaEFsbCgpLnRoZW4ocGhvdG9zID0+IHtcbiAgICAgICAgICAgICRzY29wZS5waG90b3MgPSBwaG90b3M7XG4gICAgICAgIH0pXG4gICAgfVxuXG5cbiAgICAkc2NvcGUuY3JlYXRlQWxidW0gPSAoKSA9PiB7XG4gICAgICAgICRzY29wZS5uZXdBbGJ1bSA9IHtcbiAgICAgICAgICAgIHRpdGxlOiAkc2NvcGUuYWxidW1OYW1lLFxuICAgICAgICAgICAgcGhvdG9zOiBbJ2ltYWdlL0lNR18xLmpwZyddXG4gICAgICAgIH1cbiAgICAgICAgUGhvdG9zRmFjdG9yeS5jcmVhdGVBbGJ1bSgkc2NvcGUubmV3QWxidW0pO1xuICAgIH1cblxuICAgICRzY29wZS5nZXRBbGJ1bXMgPSAoKSA9PiB7XG4gICAgICAgIFBob3Rvc0ZhY3RvcnkuZmV0Y2hBbGJ1bXMoKVxuICAgICAgICAgICAgLnRoZW4oYWxidW1zID0+IHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuYWxidW1zID0gYWxidW1zO1xuICAgICAgICAgICAgfSlcbiAgICB9XG5cbiAgICAkc2NvcGUuYWRkVG9BbGJ1bSA9IChwaG90bykgPT4ge1xuICAgICAgICBhbGJ1bUFycmF5LnB1c2gocGhvdG8pO1xuICAgIH1cblxuICAgICRzY29wZS5zYXZlQWxidW0gPSAoKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdhbGJ1bSBhcnJheScsIGFsYnVtQXJyYXkpO1xuICAgIH1cblxuICAgXG5cblxuXG5cbn0pOyIsImFwcC5mYWN0b3J5KCdQaG90b3NGYWN0b3J5JywgKCRodHRwKSA9PiB7XG5cdHJldHVybiB7XG5cdFx0YWRkUGhvdG86IChzcmMpID0+IHtcblx0XHRcdGxldCBwaG90byA9IHtcblx0XHRcdFx0c3JjOiBzcmMsXG5cdFx0XHRcdG5hbWU6ICd0ZXN0J1xuXHRcdFx0fVxuXHRcdFx0JGh0dHAucG9zdCgnL2FwaS9waG90b3MvYWRkJywgcGhvdG8pXG5cdFx0XHQudGhlbihyZXMgPT4ge1xuXHRcdFx0fSlcblx0XHR9LFxuXHRcdHNhdmVQaG90bzogKHBob3RvKSA9PiB7XG5cdFx0XHQkaHR0cC5wb3N0KCcvYXBpL3Bob3Rvcy91cGRhdGUnLCBwaG90bykudGhlbihyZXMgPT4ge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhyZXMuZGF0YSk7XG5cdFx0XHR9KVxuXHRcdH0sXG5cdFx0ZmV0Y2hBbGw6ICgpID0+IHtcblx0XHRcdHJldHVybiAkaHR0cC5nZXQoJy9hcGkvcGhvdG9zJylcblx0XHRcdC50aGVuKHJlcyA9PiB7XG5cdFx0XHRcdHJldHVybiByZXMuZGF0YTtcblx0XHRcdH0pXG5cdFx0fSxcblx0XHRmZXRjaFRlbjogKCkgPT4ge1xuXHRcdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS9waG90b3MvbGltaXQxMCcpXG5cdFx0XHQudGhlbihyZXMgPT4ge1xuXHRcdFx0XHRyZXR1cm4gcmVzLmRhdGE7XG5cdFx0XHR9KVxuXHRcdH1cblx0fVxufSk7IiwiYXBwLmNvbnRyb2xsZXIoJ1VwbG9hZFBob3RvQ3RybCcsICgkc2NvcGUsICRzdGF0ZSwgUGhvdG9zRmFjdG9yeSwgQWxidW1GYWN0b3J5LCBGaWxlVXBsb2FkZXIpID0+IHtcblx0dmFyIHVwbG9hZGVyID0gJHNjb3BlLnVwbG9hZGVyID0gbmV3IEZpbGVVcGxvYWRlcih7XG4gICAgICAgICAgICAgdXJsOiAnL2FwaS91cGxvYWQvdXBsb2FkJ1xuICAgICAgICB9KTtcbiAgICAgICAgdXBsb2FkZXIuZmlsdGVycy5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6ICdpbWFnZUZpbHRlcicsXG4gICAgICAgICAgICBmbjogZnVuY3Rpb24oaXRlbSAvKntGaWxlfEZpbGVMaWtlT2JqZWN0fSovICwgb3B0aW9ucykge1xuICAgICAgICAgICAgICAgIHZhciB0eXBlID0gJ3wnICsgaXRlbS50eXBlLnNsaWNlKGl0ZW0udHlwZS5sYXN0SW5kZXhPZignLycpICsgMSkgKyAnfCc7XG4gICAgICAgICAgICAgICAgcmV0dXJuICd8anBnfHBuZ3xqcGVnfGJtcHxnaWZ8Jy5pbmRleE9mKHR5cGUpICE9PSAtMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHVwbG9hZGVyLm9uV2hlbkFkZGluZ0ZpbGVGYWlsZWQgPSBmdW5jdGlvbihpdGVtIC8qe0ZpbGV8RmlsZUxpa2VPYmplY3R9Ki8gLCBmaWx0ZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuaW5mbygnb25XaGVuQWRkaW5nRmlsZUZhaWxlZCcsIGl0ZW0sIGZpbHRlciwgb3B0aW9ucyk7XG4gICAgICAgIH07XG4gICAgICAgIHVwbG9hZGVyLm9uQWZ0ZXJBZGRpbmdGaWxlID0gZnVuY3Rpb24oZmlsZUl0ZW0pIHtcbiAgICAgICAgICAgIGNvbnNvbGUuaW5mbygnb25BZnRlckFkZGluZ0ZpbGUnLCBmaWxlSXRlbSk7XG4gICAgICAgIH07XG4gICAgICAgIHVwbG9hZGVyLm9uQWZ0ZXJBZGRpbmdBbGwgPSBmdW5jdGlvbihhZGRlZEZpbGVJdGVtcykge1xuICAgICAgICAgICAgY29uc29sZS5pbmZvKCdvbkFmdGVyQWRkaW5nQWxsJywgYWRkZWRGaWxlSXRlbXMpO1xuICAgICAgICB9O1xuICAgICAgICB1cGxvYWRlci5vbkJlZm9yZVVwbG9hZEl0ZW0gPSBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8oJ29uQmVmb3JlVXBsb2FkSXRlbScsIGl0ZW0pO1xuICAgICAgICB9O1xuICAgICAgICB1cGxvYWRlci5vblByb2dyZXNzSXRlbSA9IGZ1bmN0aW9uKGZpbGVJdGVtLCBwcm9ncmVzcykge1xuICAgICAgICAgICAgY29uc29sZS5pbmZvKCdvblByb2dyZXNzSXRlbScsIGZpbGVJdGVtLCBwcm9ncmVzcyk7XG4gICAgICAgIH07XG4gICAgICAgIHVwbG9hZGVyLm9uUHJvZ3Jlc3NBbGwgPSBmdW5jdGlvbihwcm9ncmVzcykge1xuICAgICAgICAgICAgY29uc29sZS5pbmZvKCdvblByb2dyZXNzQWxsJywgcHJvZ3Jlc3MpO1xuICAgICAgICB9O1xuICAgICAgICB1cGxvYWRlci5vblN1Y2Nlc3NJdGVtID0gZnVuY3Rpb24oZmlsZUl0ZW0sIHJlc3BvbnNlLCBzdGF0dXMsIGhlYWRlcnMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuaW5mbygnb25TdWNjZXNzSXRlbScsIGZpbGVJdGVtLCByZXNwb25zZSwgc3RhdHVzLCBoZWFkZXJzKTtcbiAgICAgICAgfTtcbiAgICAgICAgdXBsb2FkZXIub25FcnJvckl0ZW0gPSBmdW5jdGlvbihmaWxlSXRlbSwgcmVzcG9uc2UsIHN0YXR1cywgaGVhZGVycykge1xuICAgICAgICAgICAgY29uc29sZS5pbmZvKCdvbkVycm9ySXRlbScsIGZpbGVJdGVtLCByZXNwb25zZSwgc3RhdHVzLCBoZWFkZXJzKTtcbiAgICAgICAgfTtcbiAgICAgICAgdXBsb2FkZXIub25DYW5jZWxJdGVtID0gZnVuY3Rpb24oZmlsZUl0ZW0sIHJlc3BvbnNlLCBzdGF0dXMsIGhlYWRlcnMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuaW5mbygnb25DYW5jZWxJdGVtJywgZmlsZUl0ZW0sIHJlc3BvbnNlLCBzdGF0dXMsIGhlYWRlcnMpO1xuICAgICAgICB9O1xuICAgICAgICB1cGxvYWRlci5vbkNvbXBsZXRlSXRlbSA9IGZ1bmN0aW9uKGZpbGVJdGVtLCByZXNwb25zZSwgc3RhdHVzLCBoZWFkZXJzKSB7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8oJ29uQ29tcGxldGVJdGVtJywgZmlsZUl0ZW0sIHJlc3BvbnNlLCBzdGF0dXMsIGhlYWRlcnMpO1xuICAgICAgICB9O1xuICAgICAgICB1cGxvYWRlci5vbkNvbXBsZXRlQWxsID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8oJ29uQ29tcGxldGVBbGwnKTtcbiAgICAgICAgICAgICRzY29wZS5maW5pc2goKTtcbiAgICAgICAgfTtcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3Bob3RvcycsIHtcbiAgICAgICAgdXJsOiAnL3Bob3RvcycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnL3Bob3Rvcy5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1Bob3RvQ3RybCdcbiAgICB9KTtcbn0pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhZGRwaG90bycsIHtcbiAgICAgICAgdXJsOiAnL3Bob3RvcycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnL3Bob3Rvcy1hZGQuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdQaG90b0N0cmwnXG4gICAgfSk7XG59KTtcblxuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCd1cGxvYWRQaG90b3MnLCB7XG4gICAgICAgIHVybDogJy91cGxvYWQnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJy9waG90b3MtdXBsb2FkLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnVXBsb2FkUGhvdG9DdHJsJ1xuICAgIH0pO1xufSk7XG5cbiIsImFwcC5mYWN0b3J5KCdEaWFsb2dGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsICRtZERpYWxvZywgJHRpbWVvdXQpIHsgXG5cdFxuXG5cdGxldCBzaG93RGlhbG9nID0gKG1lc3NhZ2UpID0+IHtcblx0XHR2YXIgcGFyZW50RWwgPSBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQuYm9keSk7XG4gICAgICAgJG1kRGlhbG9nLnNob3coe1xuICAgICAgICAgcGFyZW50OiBwYXJlbnRFbCxcbiAgICAgICAgIHRlbXBsYXRlOlxuICAgICAgICAgICAnPG1kLWRpYWxvZyBhcmlhLWxhYmVsPVwiTGlzdCBkaWFsb2dcIiBpZD1cImRpYWxvZ1wiPicgK1xuICAgICAgICAgICAnICA8bWQtZGlhbG9nLWNvbnRlbnQ+JytcbiAgICAgICAgICAgXHRtZXNzYWdlICtcbiAgICAgICAgICAgJyAgPC9tZC1kaWFsb2ctY29udGVudD4nICtcbiAgICAgICAgICAgJzwvbWQtZGlhbG9nPidcbiAgICAgIH0pO1xuXHR9XG5cblxuXHRyZXR1cm4ge1xuXHRcdGRpc3BsYXk6IChtZXNzYWdlLCB0aW1lb3V0KSA9PiB7XG5cdFx0XHRzaG93RGlhbG9nKG1lc3NhZ2UpO1xuXHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCRtZERpYWxvZy5oaWRlKCk7XG5cdFx0XHR9LCB0aW1lb3V0KVxuXHRcdH1cblx0fVxuXG5cblxufSk7IiwiYXBwLmRpcmVjdGl2ZSgnbmF2YmFyJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCBBVVRIX0VWRU5UUywgJHN0YXRlKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge30sXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnL25hdmJhci5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG5cbiAgICAgICAgICAgIHNjb3BlLml0ZW1zID0gW1xuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdIb21lJywgc3RhdGU6ICdob21lJyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdQaG90b3MnLCBzdGF0ZTogJ3Bob3Rvcyd9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdBbGJ1bXMnLCBzdGF0ZTogJ2FsYnVtcyd9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdBZG1pbicsIHN0YXRlOiAnYWRtaW4nfVxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG5cbiAgICAgICAgICAgIHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHNldFVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciByZW1vdmVVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2V0VXNlcigpO1xuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MsIHNldFVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdwaG90b0VkaXQnLCAoUGhvdG9zRmFjdG9yeSkgPT4ge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9waG90by9waG90by1lZGl0Lmh0bWwnLFxuXHRcdGxpbms6IChzY29wZSwgZWxlbSwgYXR0cikgPT4ge1xuXHRcdFx0c2NvcGUuc2F2ZVBob3RvID0gKCkgPT4ge1xuXHRcdFx0XHRjb25zb2xlLmxvZygncGhvdG8nLCBzY29wZS5waG90byk7XG5cdFx0XHRcdFBob3Rvc0ZhY3Rvcnkuc2F2ZVBob3RvKHNjb3BlLnBob3RvKVxuXHRcdFx0fVxuXHRcdH1cblx0fVxufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
