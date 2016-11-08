'use strict';
window.app = angular.module('ZTF', ['fsaPreBuilt', 'bootstrapLightbox', 'ui.router', 'ui.bootstrap', 'ngAnimate', 'angularFileUpload', 'ngMaterial', 'akoenig.deckgrid']);

app.config(function ($urlRouterProvider, $locationProvider, $mdThemingProvider) {
    // This turns off hashbang urls (/#about) and changes it to something normal (/about)
    $locationProvider.html5Mode(true);
    // If we go to a URL that ui-router doesn't have registered, go to the "/" url.
    $urlRouterProvider.otherwise('/');
    var customPrimary = {
        '50': '#d8bf8c',
        '100': '#d1b579',
        '200': '#cbaa66',
        '300': '#c4a053',
        '400': '#bd9540',
        '500': '#aa863a',
        '600': '#977734',
        '700': '#84682d',
        '800': '#715927',
        '900': '#5e4a20',
        'A100': '#deca9f',
        'A200': '#e5d4b2',
        'A400': '#ebdfc5',
        'A700': '#4b3b1a'
    };

    $mdThemingProvider.theme('default').primaryPalette('blue').accentPalette('purple').warnPalette('yellow');
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
            // if (user) {
            //     $state.go(toState.name, toParams);
            // } else {
            //     $state.go('login');
            // }
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
        templateUrl: 'js/admin/admin.html',
        controller: 'AlbumCtrl',
        data: {
            authenticate: true
        }
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
            DialogFactory.display("Created");
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

app.config(function ($stateProvider) {
    $stateProvider.state('singleAlbum', {
        url: '/Album/:albumId',
        templateUrl: 'js/album/single-album.html',
        controller: 'SingleAlbumCtrl',
        resolve: {
            album: function album(AlbumFactory, $stateParams) {
                return AlbumFactory.fetchOne($stateParams.albumId);
            }
        }

    });
});

app.controller('AlbumsCtrl', function ($scope, $state, PhotosFactory, AlbumFactory, UserFactory, DialogFactory) {
    AlbumFactory.fetchAll().then(function (albums) {
        $scope.albums = albums;
        $scope.albumOne = $scope.albums[0];
    });

    $scope.viewAlbum = function (album) {
        $state.go('singleAlbum', { albumId: album._id });
    };

    $scope.followAlbum = function (album) {
        UserFactory.followAlbum(album);
    };

    $scope.createAlbum = function () {
        $state.go('newAlbum');
        // let album = {
        //     title: $scope.newAlbum
        // }
        // AlbumFactory.createAlbum(album).then(album => {
        //     DialogFactory.display("Created");
        // })
    };
});
app.config(function ($stateProvider) {
    $stateProvider.state('albums', {
        url: '/albums',
        templateUrl: 'js/album/albums.html',
        controller: 'AlbumsCtrl'
    });
});
app.config(function ($stateProvider) {
    $stateProvider.state('editAlbum', {
        url: '/editAlbum/:albumId',
        templateUrl: 'js/album/edit-album.html',
        controller: 'EditAlbumCtrl',
        resolve: {
            album: function album(AlbumFactory, $stateParams) {
                return AlbumFactory.fetchOne($stateParams.albumId);
            }
        }
    });
});

app.controller('EditAlbumCtrl', function ($scope, AlbumFactory, PhotosFactory, DialogFactory, album) {
    $scope.addingPictures = false;

    var setDate = function setDate() {
        album.date = new Date(album.date);
        $scope.album = album;
    };
    setDate();

    $scope.saveAlbum = function () {
        AlbumFactory.updateAlbum($scope.album).then(function (res) {
            $scope.album = res;
            $scope.selectingPictures = false;
            DialogFactory.display('Saved', 1000);
        });
    };

    $scope.addPhotos = function () {
        console.log('adding');
        PhotosFactory.fetchAll().then(function (photos) {
            console.log('photos', photos);
            $scope.selectingPictures = true;
            $scope.photos = photos;
        });
    };

    $scope.addToAlbum = function (photo) {
        console.log("added", photo);
        $scope.album.photos.push(photo._id);
        AlbumFactory.addPhoto(album._id, photo._id);
    };
});
app.controller('NewAlbumCtrl', function ($scope, $state, AlbumFactory, PhotosFactory, Session, DialogFactory, AuthService) {
    console.log('Session', Session);
    $scope.showPhotos = false;

    $scope.createAlbum = function () {
        if (Session.user) {
            $scope.album.owner = Session.user._id;
        }
        console.log($scope.album);

        AlbumFactory.createAlbum($scope.album);
    };

    $scope.addToAlbum = function (photo) {
        DialogFactory.display('Added', 750);
        $scope.album.photos.push(photo);
        $scope.album.cover = photo;
    };

    $scope.saveAlbum = function () {
        AlbumFactory.updateAlbum($scope.album).then(function (album) {
            $state.go('albums');
        });
    };
});
app.config(function ($stateProvider) {
    $stateProvider.state('newAlbum', {
        url: '/newAlbum',
        templateUrl: 'js/album/new-album.html',
        controller: 'NewAlbumCtrl'
    });
});

app.controller('SingleAlbumCtrl', function ($scope, $timeout, $state, album, AdminFactory, AlbumFactory, PhotosFactory) {
    $scope.album = album;
    $scope.selectingCover = false;
    $scope.changesMade = false;
    $scope.removePhotos = false;

    console.log("photos: ", album.photos);
    $scope.photos = album.photos;
    $scope.removeFromAlbum = function (photo) {
        var photoIndex = $scope.album.photos.indexOf(photo);
        $scope.album.photos.splice(photoIndex, 1);
    };

    $scope.deletePhotos = function () {
        $scope.removePhotos = true;
    };

    $scope.selectCover = function () {
        $timeout(function () {
            $scope.selectingCover = true;
            $scope.changesMade = true;
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

    $scope.fetchPhotos = function () {
        console.log("album: ", album);
        AlbumFactory.fetchPhotosInAlbum(album._id).then(function (album) {
            console.log("returned: ", album);
        });
    };
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

    app.service('AuthService', function ($http, Session, $rootScope, AUTH_EVENTS, $q, $state) {
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
    $stateProvider.state('login', {
        url: '/login',
        templateUrl: 'js/auth/login.html',
        controller: 'LoginCtrl'
    });
});

app.controller('LoginCtrl', function ($scope, $state, AuthService, DialogFactory) {
    $scope.login = function () {
        var credentials = {
            email: $scope.email,
            password: $scope.password
        };
        AuthService.login(credentials).then(function (res) {
            $state.go('home');
        });
    };

    $scope.getUser = function () {
        AuthService.getLoggedInUser().then(function (user) {
            console.log('Login.js: logged in user', user);
        });
    };
});
app.controller('HomeCtrl', function ($scope, homePhotos, PhotosFactory) {
    $scope.updateAll = function () {
        PhotosFactory.updateAll();
    };

    $scope.getRandom = function () {};

    $scope.slidePhotos = homePhotos;

    $(document).ready(function () {

        $("#owl-demo").owlCarousel({

            autoPlay: 3000, //Set AutoPlay to 3 seconds

            // items: 1,
            navigation: true,
            pagination: false,
            singleItem: true

        });
    });
});
app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: '/js/home/home.html',
        controller: 'HomeCtrl',
        resolve: {
            homePhotos: function homePhotos(PhotosFactory) {
                return PhotosFactory.getRandom(10);
            }
        }

    });
});
app.config(function ($stateProvider) {
    $stateProvider.state('layout', {
        url: '/layout',
        templateUrl: 'js/layout/layout.html',
        controller: 'LayoutCtrl',
        resolve: {
            albums: function albums(AlbumFactory, $stateParams) {
                return AlbumFactory.fetchAll();
            }
        }
    });
});

app.controller('LayoutCtrl', function ($scope, PhotosFactory, albums) {
    console.log("all albums", albums);
    $scope.albums = albums;
    $scope.getFiles = function () {
        console.log("getting Files");
        PhotosFactory.getFiles();
    };
});
app.controller('SignupCtrl', function ($scope, $rootScope, UserFactory) {
    $scope.user = {};
    $scope.submit = function () {
        UserFactory.createUser($scope.user).then(function (user) {
            $rootScope.user = user;
        });
    };
});
app.config(function ($stateProvider) {
    $stateProvider.state('signup', {
        url: '/signup',
        templateUrl: 'js/signup/signup.html',
        controller: 'SignupCtrl'
    });
});
app.controller('PhotoCtrl', function ($scope, $state, PhotosFactory, AlbumFactory, UserFactory, photos) {
    var albumArray = [];
    $scope.title = "Welcome";
    $scope.photosGot = false;
    $scope.selectedPage = 0;

    // $scope.photos = shuffle(photos);
    $scope.photoPages = splitArray(shuffle(photos));

    var photoArray = [];

    function splitArray(array) {
        var returnArray = [];
        var chopArray = array;
        while (chopArray.length) {
            var newChunk = chopArray.splice(0, 20);
            if (newChunk) {
                returnArray.push(newChunk);
            }
        }
        return returnArray;
    }

    function shuffle(array) {
        var currentIndex = array.length,
            temporaryValue,
            randomIndex;

        while (0 !== currentIndex) {

            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    }

    $scope.setPage = function (index) {
        $scope.selectedPage = index;
    };

    $scope.forward = function () {
        if ($scope.selectedPage < $scope.photoPages.length) {
            $scope.selectedPage++;
        }
    };

    $scope.backward = function () {
        if ($scope.selectedPage > 0) {
            $scope.selectedPage--;
        }
    };

    // function galleryPhotos (){
    // 	let array = $scope.photoPages[0];
    // 	let items = []
    // 	array.forEach(function(elem) {
    // 		let img = new Image();
    // 		img.src = elem.src;
    // 		console.log(img.width);
    // 		let newImg = {
    // 			src: elem.src,
    // 			w: 1200,
    // 			h: 800
    // 		}
    // 		items.push(newImg);
    // 	})
    // 	console.log(items);
    // 	$scope.galleryPhotos = items;
    // }

    $scope.openGallery = function (index) {
        $scope.showGallery = true;
        var slideIndex = index;
        $scope.slideIndex = index;
        console.log(index);
        $scope.active = index;
        var imgArray = $scope.photoPages[$scope.selectedPage];
        imgArray.forEach(function (elem, index) {
            elem.id = index;
            if (index === slideIndex) {
                elem.active = true;
                console.log("active:", elem);
            }
        });
        $scope.galleryPhotos = imgArray;
    };

    $scope.show = function (photo) {
        // galleryPhotos();

    };
});
app.config(function ($stateProvider) {
    $stateProvider.state('photos', {
        url: '/photos',
        templateUrl: 'js/photos/photos.html',
        controller: 'PhotoCtrl',
        resolve: {
            photos: function photos(PhotosFactory, $stateParams) {
                return PhotosFactory.fetchAll();
            }
        }
    });
});

app.controller('UploadCtrl', function ($scope, $state, albums, PhotosFactory, AlbumFactory, FileUploader) {

    var albumCreated = false;
    var addToAlbum = undefined;

    $scope.selectedAlbum = null;

    $scope.uploadAlbum = "none";

    $scope.uploadUrl = "/api/upload/photo/";

    $scope.creatingAlbum = false;

    $scope.setAlbum = function (album) {
        $scope.selectedAlbum = album;
        $scope.uploadAlbum = album._id;
        console.log($scope.selectedAlbum);
    };
    $scope.newAlbum = false;
    $scope.photoAlbum = null;
    $scope.albums = albums;
    $scope.createAlbum = function () {
        var album = {
            title: $scope.albumTitle
        };
        if ($scope['private']) {
            album['private'] = true;
        }
        AlbumFactory.createAlbum(album).then(function (album) {
            $scope.albums.push(album);
            $scope.selectedAlbum = album;
            $scope.uploadAlbum = album._id;
            $scope.creatingAlbum = false;
        });
    };
    $scope.checkAlbum = function () {
        if (albumCreated) {
            addToAlbum = albumCreated;
        } else {
            addToAlbum = $scope.photoAlbum;
        }
    };
});
app.config(function ($stateProvider) {
    $stateProvider.state('upload', {
        url: '/upload',
        templateUrl: 'js/upload/upload.html',
        controller: 'UploadCtrl',
        resolve: {
            albums: function albums(AlbumFactory) {
                return AlbumFactory.fetchAll().then(function (albums) {
                    return albums;
                });
            }
        }
    });
});

app.factory('AlbumFactory', function ($http, $state, $timeout, DialogFactory) {
    var success = function success(text) {
        DialogFactory.display(text, 750);
    };
    return {
        createAlbum: function createAlbum(album) {
            return $http.post('/api/albums/', album).then(function (res) {
                success("created");
                console.log("res", res);
                return res.data;
            })['catch'](function (e) {
                console.error("error saving album", e);
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
        findUserAlbums: function findUserAlbums(userId) {
            return $http.get('/api/albums/user/' + userId).then(function (res) {
                return res.data;
            });
        },
        addPhoto: function addPhoto(albumId, photoId) {
            var obj = {};
            obj.albumId = albumId;
            obj.photoId = photoId;
            return $http.post('/api/albums/addPhoto', obj).then(function (res) {
                return res.data;
            });
        },
        deleteAlbum: function deleteAlbum(albumId) {
            return $http['delete']('/api/albums/' + albumId);
        },
        fetchPhotosInAlbum: function fetchPhotosInAlbum(albumId) {
            return $http.get('/api/albums/photos/' + albumId).then(function (res) {
                console.log("res");
                return res.data;
            });
        }
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
        },
        getFiles: function getFiles() {
            $http.get('/api/getFiles/albumA').then(function (res) {
                console.log("Returned: ", res.data);
            });
        },
        updateAll: function updateAll() {
            $http.put('/api/photos/updateAll').then(function (res) {
                console.log("res: ", res.data);
            });
        },
        getRandom: function getRandom(amount) {
            return $http.get('/api/photos/random/' + amount).then(function (res) {
                console.log("res: ", res.data);
                return res.data;
            });
        }
    };
});
app.factory('UserFactory', function ($http, $rootScope, DialogFactory) {
    return {
        currentUser: function currentUser() {
            var user = {
                name: 'Dane',
                picture: 'Something',
                albums: ['One', 'Two', 'Three']
            };
            return user;
            //send request for current logged-in user
        },
        createUser: function createUser(user) {
            return $http.post('/api/users/', user).then(function (res) {
                return res.data;
            });
        },
        getUser: function getUser() {
            var username = 'danetomseth';
            return $http.get('/api/users/' + username).then(function (res) {
                $rootScope.user = res.data;
                return res.data;
            });
        },

        followAlbum: function followAlbum(album) {
            var user = $rootScope.user;
            if (user.albums.indexOf() !== -1) {
                console.log('album already exists');
            }
            user.albums.push(album);

            $http.post('/api/users/update', user).then(function (res) {
                if (res.status === 200) {
                    DialogFactory.display('Added To Albums', 1000);
                } else {
                    DialogFactory.display('Status not 200', 1000);
                }
            });
        },
        followPhoto: function followPhoto(photo) {
            var user = $rootScope.user;
            if (user.photos.indexOf() !== -1) {
                console.log('Photo already exists');
            }
            user.photos.push(photo);

            $http.post('/api/users/update', user).then(function (res) {
                if (res.status === 200) {
                    DialogFactory.display('Added To Photos', 1000);
                } else {
                    DialogFactory.display('Status not 200', 1000);
                }
            });
        }
    };
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
app.directive('ztSize', function () {
    return {
        restrict: 'A',
        link: function link(scope, element, attr) {
            var size = attr.ztSize.split('x');

            if (attr.abs) {
                if (size[0].length) {
                    element.css({
                        width: size[0] + 'px'
                    });
                }

                if (size[1].length) {
                    element.css({
                        height: size[1] + 'px'
                    });
                }
            } else {
                if (size[0].length) {
                    element.css({
                        'min-width': size[0] + 'px'
                    });
                }

                if (size[1].length) {
                    element.css({
                        'min-height': size[1] + 'px'
                    });
                }
            }
        }
    };
});
app.directive('albumCard', function ($rootScope, $state) {
    return {
        restrict: 'E',
        controller: 'AlbumsCtrl',
        templateUrl: 'js/common/directives/albums/album-card.html',
        link: function link(scope) {
            scope.editAlbum = function () {
                $state.go('editAlbum', { albumId: scope.album._id });
            };

            scope.viewAlbum = function () {
                $state.go('singleAlbum', { albumId: scope.album._id });
            };

            scope.addToFavorites = function () {
                console.log("call user here");
            };
        }
    };
});
app.directive('selectAlbum', function ($rootScope) {
    return {
        restrict: 'E',
        controller: 'AlbumsCtrl',
        templateUrl: 'js/common/directives/albums/album.html',
        link: function link(scope) {}
    };
});
app.directive('userAlbums', function ($rootScope, $state) {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/albums/user-albums.html',
        link: function link(scope) {
            scope.editAlbum = function () {
                $state.go('editAlbum', { albumId: scope.album._id });
            };

            scope.addToFavorites = function () {
                console.log("call user here");
            };
        }
    };
});
app.directive('banner', function ($rootScope, $state, Session, UserFactory, AlbumFactory, AuthService) {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/banner/banner.html',
        link: function link(scope) {
            // UserFactory.getUser().then(user => {
            //     scope.user = user;
            //     return AlbumFactory.findUserAlbums(user._id)
            // }).then(albums => {
            //     scope.user.albums.push(albums);
            //     console.log(scope.user.albums);
            // })

            UserFactory.getUser().then(function (user) {
                scope.user = user;
                console.log(scope.user);

                return AlbumFactory.findUserAlbums(user._id);
            }).then(function (albums) {
                scope.userAlbums = albums;
                if (scope.user.albums.length) {
                    scope.userAlbums.push(scope.user.albums);
                }
                console.log(scope.userAlbums);
            });

            // AlbumFactory.findUserAlbums(Session.user._id)
            // .then(albums => {
            //     scope.userAlbums = albums;
            //     console.log(scope.userAlbums);
            // })

            AuthService.getLoggedInUser().then(function (user) {
                if (user) {
                    scope.user = user;
                } else {
                    scope.user = {
                        first: 'Guest',
                        last: ''
                    };
                }
            });
            scope.showAlbums = false;
            scope.showPictures = false;

            scope.addAlbums = function () {
                scope.showAlbums = true;
            };

            scope.addPictures = function () {
                scope.showPictures = true;
            };

            scope.viewAlbum = function (album) {
                $state.go('singleAlbum', {
                    albumId: album._id
                });
            };
        }
    };
});
app.directive('footerElem', function () {
    return {
        restrict: 'AE',
        templateUrl: 'js/common/directives/footer/footer.html',
        link: function link(scope, element, attrs) {}
    };
});
app.directive('photoGallery', function () {
    return {
        restrict: 'AE',
        templateUrl: 'js/common/directives/gallery/gallery.html',
        link: function link(scope, element, attrs) {

            scope.startGallery = function (item) {
                console.log(item);
            };
        }
    };
});
app.directive('imgLoading', function () {
    return {
        restrict: 'AE',
        templateUrl: 'js/common/directives/loader/imgloading.html',
        link: function link(scope, element, attrs) {}
    };
});
app.directive('navbar', function ($rootScope, AuthService, AUTH_EVENTS, $state) {

    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/common/directives/navbar/navbar.html',
        link: function link(scope) {

            $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
                scope.currentPage = toState.name;
            });

            scope.items = [{
                label: 'Home',
                state: 'home'
            }, {
                label: 'Photos',
                state: 'photos'
            }, {
                label: 'Albums',
                state: 'albums'
            }, {
                label: 'Upload',
                state: 'upload'
            }, {
                label: 'New Album',
                state: 'newAlbum'
            }, {
                label: 'Admin',
                state: 'admin'
            }];

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
app.directive('imageonload', function () {
    return {
        restrict: 'A',
        link: function link(scope, element, attrs) {

            element.css({
                display: 'none'
            });

            element.bind('error', function () {
                alert('image could not be loaded');
            });

            element.on('load', function () {
                scope.$apply(function () {
                    scope.photo.visible = true;
                });
                element.css({
                    display: 'block'
                });
            });

            // scope.photo.visible = true;

            scope.imageLoaded = true;
        }
    };
});
app.directive('photoEdit', function (PhotosFactory) {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/photo/photo-edit.html',
        link: function link(scope, elem, attr) {
            scope.savePhoto = function () {
                PhotosFactory.savePhoto(scope.photo);
            };
        }
    };
});
app.directive('singlePhoto', function ($rootScope, $state) {
    return {
        restrict: 'E',
        scope: {
            photo: '='
        },
        templateUrl: 'js/common/directives/photo/single-photo.html',
        link: function link(scope) {
            scope.viewPhoto = function () {
                console.log(scope.photo);
            };
        }
    };
});
app.directive('uploader', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/upload/upload.html',
        link: function link(scope, elem, attr) {

            var galleryUploader = new qq.FineUploader({
                element: document.getElementById("fine-uploader-gallery"),
                template: 'qq-template-gallery',
                request: {
                    endpoint: '/api/upload/photo/' + scope.uploadAlbum
                },
                thumbnails: {
                    placeholders: {
                        waitingPath: '/assets/placeholders/waiting-generic.png',
                        notAvailablePath: '/assets/placeholders/not_available-generic.png'
                    }
                },
                validation: {
                    allowedExtensions: ['jpeg', 'jpg', 'gif', 'png']
                }
            });

            var updateEndpoint = function updateEndpoint() {
                var endpoint = '/api/upload/photo/' + scope.uploadAlbum;
                galleryUploader.setEndpoint(endpoint);
                console.log("endpoint updated");
            };
            scope.$watch('uploadAlbum', function (newVal, oldVal) {
                updateEndpoint();
            });
        }

    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFkbWluL2FkbWluLWNvbnRyb2xsZXIuanMiLCJhZG1pbi9hZG1pbi1mYWN0b3J5LmpzIiwiYWRtaW4vYWRtaW4uanMiLCJhbGJ1bS9hbGJ1bS1jb250cm9sbGVyLmpzIiwiYWxidW0vYWxidW0uanMiLCJhbGJ1bS9hbGJ1bXMtY29udHJvbGxlci5qcyIsImFsYnVtL2FsYnVtcy5qcyIsImFsYnVtL2VkaXQtYWxidW0uanMiLCJhbGJ1bS9uZXctYWxidW0tY29udHJvbGxlci5qcyIsImFsYnVtL25ldy1hbGJ1bS5qcyIsImFsYnVtL3NpbmdsZS1hbGJ1bS1jb250cm9sbGVyLmpzIiwiYXV0aC9hdXRoLmpzIiwiYXV0aC9sb2dpbi5qcyIsImhvbWUvaG9tZS5jb250cm9sbGVyLmpzIiwiaG9tZS9ob21lLmpzIiwibGF5b3V0L2xheW91dC5qcyIsInNpZ251cC9zaWdudXAtY29udHJvbGxlci5qcyIsInNpZ251cC9zaWdudXAuanMiLCJwaG90b3MvcGhvdG9zLWNvbnRyb2xsZXIuanMiLCJwaG90b3MvcGhvdG9zLmpzIiwidXBsb2FkL3VwbG9hZC5jb250cm9sbGVyLmpzIiwidXBsb2FkL3VwbG9hZC5qcyIsImNvbW1vbi9mYWN0b3JpZXMvYWxidW0tZmFjdG9yeS5qcyIsImNvbW1vbi9mYWN0b3JpZXMvcGhvdG9zLWZhY3RvcnkuanMiLCJjb21tb24vZmFjdG9yaWVzL3VzZXItZmFjdG9yeS5qcyIsImNvbW1vbi9kaWFsb2cvZGlhbG9nLWZhY3RvcnkuanMiLCJjb21tb24vZGlyZWN0aXZlcy9zZXRTaXplLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvYWxidW1zL2FsYnVtLWNhcmQuanMiLCJjb21tb24vZGlyZWN0aXZlcy9hbGJ1bXMvYWxidW0uanMiLCJjb21tb24vZGlyZWN0aXZlcy9hbGJ1bXMvdXNlci1hbGJ1bXMuanMiLCJjb21tb24vZGlyZWN0aXZlcy9iYW5uZXIvYmFubmVyLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvZm9vdGVyL2Zvb3Rlci5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2dhbGxlcnkvZ2FsbGVyeS5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2xvYWRlci9pbWdsb2FkaW5nLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3Bob3RvL2ltYWdlb25sb2FkLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvcGhvdG8vcGhvdG8tZWRpdC5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3Bob3RvL3NpbmdsZS1waG90by5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3VwbG9hZC91cGxvYWQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBQSxDQUFBO0FBQ0EsTUFBQSxDQUFBLEdBQUEsR0FBQSxPQUFBLENBQUEsTUFBQSxDQUFBLEtBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxtQkFBQSxFQUFBLFdBQUEsRUFBQSxjQUFBLEVBQUEsV0FBQSxFQUFBLG1CQUFBLEVBQUEsWUFBQSxFQUFBLGtCQUFBLENBQUEsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxrQkFBQSxFQUFBLGlCQUFBLEVBQUEsa0JBQUEsRUFBQTs7QUFFQSxxQkFBQSxDQUFBLFNBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTs7QUFFQSxzQkFBQSxDQUFBLFNBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLFFBQUEsYUFBQSxHQUFBO0FBQ0EsWUFBQSxFQUFBLFNBQUE7QUFDQSxhQUFBLEVBQUEsU0FBQTtBQUNBLGFBQUEsRUFBQSxTQUFBO0FBQ0EsYUFBQSxFQUFBLFNBQUE7QUFDQSxhQUFBLEVBQUEsU0FBQTtBQUNBLGFBQUEsRUFBQSxTQUFBO0FBQ0EsYUFBQSxFQUFBLFNBQUE7QUFDQSxhQUFBLEVBQUEsU0FBQTtBQUNBLGFBQUEsRUFBQSxTQUFBO0FBQ0EsYUFBQSxFQUFBLFNBQUE7QUFDQSxjQUFBLEVBQUEsU0FBQTtBQUNBLGNBQUEsRUFBQSxTQUFBO0FBQ0EsY0FBQSxFQUFBLFNBQUE7QUFDQSxjQUFBLEVBQUEsU0FBQTtLQUNBLENBQUE7O0FBR0Esc0JBQUEsQ0FBQSxLQUFBLENBQUEsU0FBQSxDQUFBLENBQ0EsY0FBQSxDQUFBLE1BQUEsQ0FBQSxDQUNBLGFBQUEsQ0FBQSxRQUFBLENBQUEsQ0FDQSxXQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7OztBQUdBLEdBQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTs7O0FBR0EsUUFBQSw0QkFBQSxHQUFBLFNBQUEsNEJBQUEsQ0FBQSxLQUFBLEVBQUE7QUFDQSxlQUFBLEtBQUEsQ0FBQSxJQUFBLElBQUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxZQUFBLENBQUE7S0FDQSxDQUFBOzs7O0FBSUEsY0FBQSxDQUFBLEdBQUEsQ0FBQSxtQkFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxRQUFBLEVBQUE7O0FBRUEsWUFBQSxDQUFBLDRCQUFBLENBQUEsT0FBQSxDQUFBLEVBQUE7OztBQUdBLG1CQUFBO1NBQ0E7O0FBRUEsWUFBQSxXQUFBLENBQUEsZUFBQSxFQUFBLEVBQUE7OztBQUdBLG1CQUFBO1NBQ0E7OztBQUdBLGFBQUEsQ0FBQSxjQUFBLEVBQUEsQ0FBQTs7QUFFQSxtQkFBQSxDQUFBLGVBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTs7Ozs7Ozs7OztTQVVBLENBQUEsQ0FBQTtLQUVBLENBQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTs7QUN6RUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxXQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLFlBQUEsRUFBQSxZQUFBLEVBQUEsYUFBQSxFQUFBO0FBQ0EsVUFBQSxDQUFBLGNBQUEsR0FBQSxLQUFBLENBQUE7O0FBRUEsZ0JBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxlQUFBLENBQUEsR0FBQSxDQUFBLFNBQUEsRUFBQSxNQUFBLENBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLFFBQUEsR0FBQSxNQUFBLENBQUEsTUFBQSxDQUFBLENBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLGlCQUFBLENBQUEsUUFBQSxFQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFdBQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLG9CQUFBLENBQUEsV0FBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLFlBQUEsVUFBQSxHQUFBLE1BQUEsQ0FBQSxNQUFBLENBQUEsT0FBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLE1BQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxFQUFBLENBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxZQUFBLEtBQUEsR0FBQTtBQUNBLGlCQUFBLEVBQUEsTUFBQSxDQUFBLFFBQUE7U0FDQSxDQUFBO0FBQ0Esb0JBQUEsQ0FBQSxXQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxNQUFBLENBQUEsSUFBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBO0FBQ0Esa0JBQUEsQ0FBQSxRQUFBLEdBQUEsRUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsU0FBQSxHQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLGlCQUFBLEdBQUEsSUFBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLFlBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxxQkFBQSxDQUFBLFFBQUEsRUFBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFNBQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxFQUFBLENBQUEsYUFBQSxFQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFHQSxVQUFBLENBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxvQkFBQSxDQUFBLFdBQUEsQ0FBQSxNQUFBLENBQUEsWUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxNQUFBLEVBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFlBQUEsR0FBQSxZQUFBO0FBQ0EsY0FBQSxDQUFBLEVBQUEsQ0FBQSxjQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFVBQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxZQUFBLENBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDMURBLEdBQUEsQ0FBQSxPQUFBLENBQUEsY0FBQSxFQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsV0FBQSxFQUVBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNKQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLENBQUEsT0FBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFFBQUE7QUFDQSxtQkFBQSxFQUFBLHFCQUFBO0FBQ0Esa0JBQUEsRUFBQSxXQUFBO0FBQ0EsWUFBQSxFQUFBO0FBQ0Esd0JBQUEsRUFBQSxJQUFBO1NBQ0E7S0FDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNUQSxHQUFBLENBQUEsVUFBQSxDQUFBLFdBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxRQUFBLEVBQUEsTUFBQSxFQUFBLFlBQUEsRUFBQSxZQUFBLEVBQUEsYUFBQSxFQUFBLGFBQUEsRUFBQTtBQUNBLFVBQUEsQ0FBQSxjQUFBLEdBQUEsS0FBQSxDQUFBOztBQUVBLGdCQUFBLENBQUEsUUFBQSxFQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsUUFBQSxHQUFBLE1BQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQSxDQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsaUJBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBQTtLQUNBLENBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsV0FBQSxHQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0Esb0JBQUEsQ0FBQSxXQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsWUFBQSxVQUFBLEdBQUEsTUFBQSxDQUFBLE1BQUEsQ0FBQSxPQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsTUFBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLEVBQUEsQ0FBQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsWUFBQTtBQUNBLFlBQUEsS0FBQSxHQUFBO0FBQ0EsaUJBQUEsRUFBQSxNQUFBLENBQUEsUUFBQTtTQUNBLENBQUE7QUFDQSxvQkFBQSxDQUFBLFdBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSx5QkFBQSxDQUFBLE9BQUEsQ0FBQSxTQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFNBQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxpQkFBQSxHQUFB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QUNBLGtCQUFBLEVBQUEsWUFBQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ05BLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxXQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEscUJBQUE7QUFDQSxtQkFBQSxFQUFBLDBCQUFBO0FBQ0Esa0JBQUEsRUFBQSxlQUFBO0FBQ0EsZUFBQSxFQUFBO0FBQ0EsaUJBQUEsRUFBQSxlQUFBLFlBQUEsRUFBQSxZQUFBLEVBQUE7QUFDQSx1QkFBQSxZQUFBLENBQUEsUUFBQSxDQUFBLFlBQUEsQ0FBQSxPQUFBLENBQUEsQ0FBQTthQUNBO1NBQ0E7S0FDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FBR0EsR0FBQSxDQUFBLFVBQUEsQ0FBQSxlQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsWUFBQSxFQUFBLGFBQUEsRUFBQSxhQUFBLEVBQUEsS0FBQSxFQUFBO0FBQ0EsVUFBQSxDQUFBLGNBQUEsR0FBQSxLQUFBLENBQUE7O0FBRUEsUUFBQSxPQUFBLEdBQUEsU0FBQSxPQUFBLEdBQUE7QUFDQSxhQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsSUFBQSxDQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxLQUFBLEdBQUEsS0FBQSxDQUFBO0tBQ0EsQ0FBQTtBQUNBLFdBQUEsRUFBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxTQUFBLEdBQUEsWUFBQTtBQUNBLG9CQUFBLENBQUEsV0FBQSxDQUFBLE1BQUEsQ0FBQSxLQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsR0FBQSxHQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLGlCQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EseUJBQUEsQ0FBQSxPQUFBLENBQUEsT0FBQSxFQUFBLElBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsU0FBQSxHQUFBLFlBQUE7QUFDQSxlQUFBLENBQUEsR0FBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO0FBQ0EscUJBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxRQUFBLEVBQUEsTUFBQSxDQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLGlCQUFBLEdBQUEsSUFBQSxDQUFBO0FBQ0Esa0JBQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsVUFBQSxHQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsZUFBQSxDQUFBLEdBQUEsQ0FBQSxPQUFBLEVBQUEsS0FBQSxDQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsS0FBQSxDQUFBLE1BQUEsQ0FBQSxJQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0Esb0JBQUEsQ0FBQSxRQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDOUNBLEdBQUEsQ0FBQSxVQUFBLENBQUEsY0FBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxZQUFBLEVBQUEsYUFBQSxFQUFBLE9BQUEsRUFBQSxhQUFBLEVBQUEsV0FBQSxFQUFBO0FBQ0EsV0FBQSxDQUFBLEdBQUEsQ0FBQSxTQUFBLEVBQUEsT0FBQSxDQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsVUFBQSxHQUFBLEtBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxZQUFBLE9BQUEsQ0FBQSxJQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxLQUFBLEdBQUEsT0FBQSxDQUFBLElBQUEsQ0FBQSxHQUFBLENBQUE7U0FDQTtBQUNBLGVBQUEsQ0FBQSxHQUFBLENBQUEsTUFBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBOztBQUVBLG9CQUFBLENBQUEsV0FBQSxDQUFBLE1BQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBSUEsVUFBQSxDQUFBLFVBQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLHFCQUFBLENBQUEsT0FBQSxDQUFBLE9BQUEsRUFBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxLQUFBLENBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxLQUFBLENBQUEsS0FBQSxHQUFBLEtBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFNBQUEsR0FBQSxZQUFBO0FBQ0Esb0JBQUEsQ0FBQSxXQUFBLENBQUEsTUFBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsRUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQzFCQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLENBQUEsVUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFdBQUE7QUFDQSxtQkFBQSxFQUFBLHlCQUFBO0FBQ0Esa0JBQUEsRUFBQSxjQUFBO0tBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQ05BLEdBQUEsQ0FBQSxVQUFBLENBQUEsaUJBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxRQUFBLEVBQUEsTUFBQSxFQUFBLEtBQUEsRUFBQSxZQUFBLEVBQUEsWUFBQSxFQUFBLGFBQUEsRUFBQTtBQUNBLFVBQUEsQ0FBQSxLQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLGNBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsV0FBQSxHQUFBLEtBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxZQUFBLEdBQUEsS0FBQSxDQUFBOztBQUdBLFdBQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxFQUFBLEtBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxNQUFBLEdBQUEsS0FBQSxDQUFBLE1BQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxlQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxZQUFBLFVBQUEsR0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBLE1BQUEsQ0FBQSxPQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsS0FBQSxDQUFBLE1BQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxFQUFBLENBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsWUFBQSxHQUFBLFlBQUE7QUFDQSxjQUFBLENBQUEsWUFBQSxHQUFBLElBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFdBQUEsR0FBQSxZQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxZQUFBO0FBQ0Esa0JBQUEsQ0FBQSxjQUFBLEdBQUEsSUFBQSxDQUFBO0FBQ0Esa0JBQUEsQ0FBQSxXQUFBLEdBQUEsSUFBQSxDQUFBO1NBQ0EsRUFBQSxHQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFFBQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxLQUFBLENBQUEsS0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsY0FBQSxHQUFBLEtBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFdBQUEsR0FBQSxZQUFBO0FBQ0Esb0JBQUEsQ0FBQSxXQUFBLENBQUEsTUFBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsRUFBQSxDQUFBLE9BQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFHQSxVQUFBLENBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxlQUFBLENBQUEsR0FBQSxDQUFBLFNBQUEsRUFBQSxLQUFBLENBQUEsQ0FBQTtBQUNBLG9CQUFBLENBQUEsa0JBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxHQUFBLENBQUEsWUFBQSxFQUFBLEtBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQzVDQSxDQUFBLFlBQUE7O0FBRUEsZ0JBQUEsQ0FBQTs7O0FBR0EsUUFBQSxDQUFBLE1BQUEsQ0FBQSxPQUFBLEVBQUEsTUFBQSxJQUFBLEtBQUEsQ0FBQSx3QkFBQSxDQUFBLENBQUE7O0FBRUEsUUFBQSxHQUFBLEdBQUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSxhQUFBLEVBQUEsRUFBQSxDQUFBLENBQUE7O0FBRUEsT0FBQSxDQUFBLE9BQUEsQ0FBQSxRQUFBLEVBQUEsWUFBQTtBQUNBLFlBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxFQUFBLE1BQUEsSUFBQSxLQUFBLENBQUEsc0JBQUEsQ0FBQSxDQUFBO0FBQ0EsZUFBQSxNQUFBLENBQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQSxRQUFBLENBQUEsTUFBQSxDQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7Ozs7O0FBS0EsT0FBQSxDQUFBLFFBQUEsQ0FBQSxhQUFBLEVBQUE7QUFDQSxvQkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsRUFBQSxtQkFBQTtBQUNBLHFCQUFBLEVBQUEscUJBQUE7QUFDQSxzQkFBQSxFQUFBLHNCQUFBO0FBQ0Esd0JBQUEsRUFBQSx3QkFBQTtBQUNBLHFCQUFBLEVBQUEscUJBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsT0FBQSxDQUFBLE9BQUEsQ0FBQSxpQkFBQSxFQUFBLFVBQUEsVUFBQSxFQUFBLEVBQUEsRUFBQSxXQUFBLEVBQUE7QUFDQSxZQUFBLFVBQUEsR0FBQTtBQUNBLGVBQUEsRUFBQSxXQUFBLENBQUEsZ0JBQUE7QUFDQSxlQUFBLEVBQUEsV0FBQSxDQUFBLGFBQUE7QUFDQSxlQUFBLEVBQUEsV0FBQSxDQUFBLGNBQUE7QUFDQSxlQUFBLEVBQUEsV0FBQSxDQUFBLGNBQUE7U0FDQSxDQUFBO0FBQ0EsZUFBQTtBQUNBLHlCQUFBLEVBQUEsdUJBQUEsUUFBQSxFQUFBO0FBQ0EsMEJBQUEsQ0FBQSxVQUFBLENBQUEsVUFBQSxDQUFBLFFBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLHVCQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7YUFDQTtTQUNBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGFBQUEsRUFBQTtBQUNBLHFCQUFBLENBQUEsWUFBQSxDQUFBLElBQUEsQ0FBQSxDQUNBLFdBQUEsRUFDQSxVQUFBLFNBQUEsRUFBQTtBQUNBLG1CQUFBLFNBQUEsQ0FBQSxHQUFBLENBQUEsaUJBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsT0FBQSxDQUFBLE9BQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsRUFBQSxFQUFBLE1BQUEsRUFBQTtBQUNBLGlCQUFBLGlCQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0EsZ0JBQUEsSUFBQSxHQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUE7QUFDQSxtQkFBQSxDQUFBLE1BQUEsQ0FBQSxJQUFBLENBQUEsRUFBQSxFQUFBLElBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTtBQUNBLHNCQUFBLENBQUEsVUFBQSxDQUFBLFdBQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLElBQUEsQ0FBQSxJQUFBLENBQUE7U0FDQTs7OztBQUlBLFlBQUEsQ0FBQSxlQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLENBQUEsQ0FBQSxPQUFBLENBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQTs7QUFFQSxZQUFBLENBQUEsZUFBQSxHQUFBLFVBQUEsVUFBQSxFQUFBOzs7Ozs7Ozs7O0FBVUEsZ0JBQUEsSUFBQSxDQUFBLGVBQUEsRUFBQSxJQUFBLFVBQUEsS0FBQSxJQUFBLEVBQUE7QUFDQSx1QkFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLE9BQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTthQUNBOzs7OztBQUtBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLGlCQUFBLENBQUEsU0FBQSxDQUFBLFlBQUE7QUFDQSx1QkFBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FFQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxLQUFBLEdBQUEsVUFBQSxXQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsSUFBQSxDQUFBLFFBQUEsRUFBQSxXQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsaUJBQUEsQ0FBQSxTQUNBLENBQUEsWUFBQTtBQUNBLHVCQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxPQUFBLEVBQUEsNEJBQUEsRUFBQSxDQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxNQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsU0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSx1QkFBQSxDQUFBLE9BQUEsRUFBQSxDQUFBO0FBQ0EsMEJBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxDQUFBLGFBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0EsQ0FBQTtLQUVBLENBQUEsQ0FBQTs7QUFFQSxPQUFBLENBQUEsT0FBQSxDQUFBLFNBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUE7O0FBRUEsWUFBQSxJQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLGtCQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxnQkFBQSxFQUFBLFlBQUE7QUFDQSxnQkFBQSxDQUFBLE9BQUEsRUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBOztBQUVBLGtCQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxjQUFBLEVBQUEsWUFBQTtBQUNBLGdCQUFBLENBQUEsT0FBQSxFQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7O0FBRUEsWUFBQSxDQUFBLEVBQUEsR0FBQSxJQUFBLENBQUE7QUFDQSxZQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxZQUFBLENBQUEsTUFBQSxHQUFBLFVBQUEsU0FBQSxFQUFBLElBQUEsRUFBQTtBQUNBLGdCQUFBLENBQUEsRUFBQSxHQUFBLFNBQUEsQ0FBQTtBQUNBLGdCQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTtTQUNBLENBQUE7O0FBRUEsWUFBQSxDQUFBLE9BQUEsR0FBQSxZQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxFQUFBLEdBQUEsSUFBQSxDQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQTtLQUVBLENBQUEsQ0FBQTtDQUVBLENBQUEsRUFBQSxDQUFBOztBQ25JQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLENBQUEsT0FBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFFBQUE7QUFDQSxtQkFBQSxFQUFBLG9CQUFBO0FBQ0Esa0JBQUEsRUFBQSxXQUFBO0tBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxXQUFBLEVBQUEsYUFBQSxFQUFBO0FBQ0EsVUFBQSxDQUFBLEtBQUEsR0FBQSxZQUFBO0FBQ0EsWUFBQSxXQUFBLEdBQUE7QUFDQSxpQkFBQSxFQUFBLE1BQUEsQ0FBQSxLQUFBO0FBQ0Esb0JBQUEsRUFBQSxNQUFBLENBQUEsUUFBQTtTQUNBLENBQUE7QUFDQSxtQkFBQSxDQUFBLEtBQUEsQ0FBQSxXQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLE9BQUEsR0FBQSxZQUFBO0FBQ0EsbUJBQUEsQ0FBQSxlQUFBLEVBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSwwQkFBQSxFQUFBLElBQUEsQ0FBQSxDQUFBO1NBRUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ3pCQSxHQUFBLENBQUEsVUFBQSxDQUFBLFVBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxVQUFBLEVBQUEsYUFBQSxFQUFBO0FBQ0EsVUFBQSxDQUFBLFNBQUEsR0FBQSxZQUFBO0FBQ0EscUJBQUEsQ0FBQSxTQUFBLEVBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFNBQUEsR0FBQSxZQUFBLEVBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsV0FBQSxHQUFBLFVBQUEsQ0FBQTs7QUFHQSxLQUFBLENBQUEsUUFBQSxDQUFBLENBQUEsS0FBQSxDQUFBLFlBQUE7O0FBRUEsU0FBQSxDQUFBLFdBQUEsQ0FBQSxDQUFBLFdBQUEsQ0FBQTs7QUFFQSxvQkFBQSxFQUFBLElBQUE7OztBQUdBLHNCQUFBLEVBQUEsSUFBQTtBQUNBLHNCQUFBLEVBQUEsS0FBQTtBQUNBLHNCQUFBLEVBQUEsSUFBQTs7U0FFQSxDQUFBLENBQUE7S0FFQSxDQUFBLENBQUE7Q0FHQSxDQUFBLENBQUE7QUMzQkEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsS0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxHQUFBO0FBQ0EsbUJBQUEsRUFBQSxvQkFBQTtBQUNBLGtCQUFBLEVBQUEsVUFBQTtBQUNBLGVBQUEsRUFBQTtBQUNBLHNCQUFBLEVBQUEsb0JBQUEsYUFBQSxFQUFBO0FBQ0EsdUJBQUEsYUFBQSxDQUFBLFNBQUEsQ0FBQSxFQUFBLENBQUEsQ0FBQTthQUNBO1NBQ0E7O0tBRUEsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDWkEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsS0FBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxTQUFBO0FBQ0EsbUJBQUEsRUFBQSx1QkFBQTtBQUNBLGtCQUFBLEVBQUEsWUFBQTtBQUNBLGVBQUEsRUFBQTtBQUNBLGtCQUFBLEVBQUEsZ0JBQUEsWUFBQSxFQUFBLFlBQUEsRUFBQTtBQUNBLHVCQUFBLFlBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FBQTthQUNBO1NBQ0E7S0FDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FBR0EsR0FBQSxDQUFBLFVBQUEsQ0FBQSxZQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsYUFBQSxFQUFBLE1BQUEsRUFBQTtBQUNBLFdBQUEsQ0FBQSxHQUFBLENBQUEsWUFBQSxFQUFBLE1BQUEsQ0FBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsUUFBQSxHQUFBLFlBQUE7QUFDQSxlQUFBLENBQUEsR0FBQSxDQUFBLGVBQUEsQ0FBQSxDQUFBO0FBQ0EscUJBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FBQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNyQkEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxZQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQTtBQUNBLFVBQUEsQ0FBQSxJQUFBLEdBQUEsRUFBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLE1BQUEsR0FBQSxZQUFBO0FBQ0EsbUJBQUEsQ0FBQSxVQUFBLENBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLHNCQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNSQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFNBQUE7QUFDQSxtQkFBQSxFQUFBLHVCQUFBO0FBQ0Esa0JBQUEsRUFBQSxZQUFBO0tBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDTkEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxXQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLGFBQUEsRUFBQSxZQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTtBQUNBLFFBQUEsVUFBQSxHQUFBLEVBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxLQUFBLEdBQUEsU0FBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLFNBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsWUFBQSxHQUFBLENBQUEsQ0FBQTs7O0FBSUEsVUFBQSxDQUFBLFVBQUEsR0FBQSxVQUFBLENBQUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSxDQUFBLENBQUE7O0FBRUEsUUFBQSxVQUFBLEdBQUEsRUFBQSxDQUFBOztBQUVBLGFBQUEsVUFBQSxDQUFBLEtBQUEsRUFBQTtBQUNBLFlBQUEsV0FBQSxHQUFBLEVBQUEsQ0FBQTtBQUNBLFlBQUEsU0FBQSxHQUFBLEtBQUEsQ0FBQTtBQUNBLGVBQUEsU0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLGdCQUFBLFFBQUEsR0FBQSxTQUFBLENBQUEsTUFBQSxDQUFBLENBQUEsRUFBQSxFQUFBLENBQUEsQ0FBQTtBQUNBLGdCQUFBLFFBQUEsRUFBQTtBQUNBLDJCQUFBLENBQUEsSUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO2FBQ0E7U0FDQTtBQUNBLGVBQUEsV0FBQSxDQUFBO0tBQ0E7O0FBRUEsYUFBQSxPQUFBLENBQUEsS0FBQSxFQUFBO0FBQ0EsWUFBQSxZQUFBLEdBQUEsS0FBQSxDQUFBLE1BQUE7WUFDQSxjQUFBO1lBQUEsV0FBQSxDQUFBOztBQUVBLGVBQUEsQ0FBQSxLQUFBLFlBQUEsRUFBQTs7QUFFQSx1QkFBQSxHQUFBLElBQUEsQ0FBQSxLQUFBLENBQUEsSUFBQSxDQUFBLE1BQUEsRUFBQSxHQUFBLFlBQUEsQ0FBQSxDQUFBO0FBQ0Esd0JBQUEsSUFBQSxDQUFBLENBQUE7O0FBRUEsMEJBQUEsR0FBQSxLQUFBLENBQUEsWUFBQSxDQUFBLENBQUE7QUFDQSxpQkFBQSxDQUFBLFlBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxXQUFBLENBQUEsQ0FBQTtBQUNBLGlCQUFBLENBQUEsV0FBQSxDQUFBLEdBQUEsY0FBQSxDQUFBO1NBQ0E7QUFDQSxlQUFBLEtBQUEsQ0FBQTtLQUNBOztBQU1BLFVBQUEsQ0FBQSxPQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsWUFBQSxHQUFBLEtBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLE9BQUEsR0FBQSxZQUFBO0FBQ0EsWUFBQSxNQUFBLENBQUEsWUFBQSxHQUFBLE1BQUEsQ0FBQSxVQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxZQUFBLEVBQUEsQ0FBQTtTQUNBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsUUFBQSxHQUFBLFlBQUE7QUFDQSxZQUFBLE1BQUEsQ0FBQSxZQUFBLEdBQUEsQ0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxZQUFBLEVBQUEsQ0FBQTtTQUNBO0tBQ0EsQ0FBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFxQkEsVUFBQSxDQUFBLFdBQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxXQUFBLEdBQUEsSUFBQSxDQUFBO0FBQ0EsWUFBQSxVQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLFVBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxlQUFBLENBQUEsR0FBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLE1BQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxZQUFBLFFBQUEsR0FBQSxNQUFBLENBQUEsVUFBQSxDQUFBLE1BQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQTtBQUNBLGdCQUFBLENBQUEsT0FBQSxDQUFBLFVBQUEsSUFBQSxFQUFBLEtBQUEsRUFBQTtBQUNBLGdCQUFBLENBQUEsRUFBQSxHQUFBLEtBQUEsQ0FBQTtBQUNBLGdCQUFBLEtBQUEsS0FBQSxVQUFBLEVBQUE7QUFDQSxvQkFBQSxDQUFBLE1BQUEsR0FBQSxJQUFBLENBQUE7QUFDQSx1QkFBQSxDQUFBLEdBQUEsQ0FBQSxTQUFBLEVBQUEsSUFBQSxDQUFBLENBQUE7YUFDQTtTQUNBLENBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxhQUFBLEdBQUEsUUFBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsSUFBQSxHQUFBLFVBQUEsS0FBQSxFQUFBOzs7S0FJQSxDQUFBO0NBSUEsQ0FBQSxDQUFBO0FDeEdBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsU0FBQTtBQUNBLG1CQUFBLEVBQUEsdUJBQUE7QUFDQSxrQkFBQSxFQUFBLFdBQUE7QUFDQSxlQUFBLEVBQUE7QUFDQSxrQkFBQSxFQUFBLGdCQUFBLGFBQUEsRUFBQSxZQUFBLEVBQUE7QUFDQSx1QkFBQSxhQUFBLENBQUEsUUFBQSxFQUFBLENBQUE7YUFDQTtTQUNBO0tBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQ1hBLEdBQUEsQ0FBQSxVQUFBLENBQUEsWUFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsYUFBQSxFQUFBLFlBQUEsRUFBQSxZQUFBLEVBQUE7O0FBRUEsUUFBQSxZQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EsUUFBQSxVQUFBLFlBQUEsQ0FBQTs7QUFHQSxVQUFBLENBQUEsYUFBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsV0FBQSxHQUFBLE1BQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsU0FBQSxHQUFBLG9CQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLGFBQUEsR0FBQSxLQUFBLENBQUE7O0FBR0EsVUFBQSxDQUFBLFFBQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxhQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLFdBQUEsR0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBO0FBQ0EsZUFBQSxDQUFBLEdBQUEsQ0FBQSxNQUFBLENBQUEsYUFBQSxDQUFBLENBQUE7S0FDQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLFFBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsVUFBQSxHQUFBLElBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLFdBQUEsR0FBQSxZQUFBO0FBQ0EsWUFBQSxLQUFBLEdBQUE7QUFDQSxpQkFBQSxFQUFBLE1BQUEsQ0FBQSxVQUFBO1NBQ0EsQ0FBQTtBQUNBLFlBQUEsTUFBQSxXQUFBLEVBQUE7QUFDQSxpQkFBQSxXQUFBLEdBQUEsSUFBQSxDQUFBO1NBQ0E7QUFDQSxvQkFBQSxDQUFBLFdBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLE1BQUEsQ0FBQSxJQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLGFBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLFdBQUEsR0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBO0FBQ0Esa0JBQUEsQ0FBQSxhQUFBLEdBQUEsS0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxVQUFBLEdBQUEsWUFBQTtBQUNBLFlBQUEsWUFBQSxFQUFBO0FBQ0Esc0JBQUEsR0FBQSxZQUFBLENBQUE7U0FDQSxNQUFBO0FBQ0Esc0JBQUEsR0FBQSxNQUFBLENBQUEsVUFBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBO0NBSUEsQ0FBQSxDQUFBO0FDL0NBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsU0FBQTtBQUNBLG1CQUFBLEVBQUEsdUJBQUE7QUFDQSxrQkFBQSxFQUFBLFlBQUE7QUFDQSxlQUFBLEVBQUE7QUFDQSxrQkFBQSxFQUFBLGdCQUFBLFlBQUEsRUFBQTtBQUNBLHVCQUFBLFlBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSwyQkFBQSxNQUFBLENBQUE7aUJBQ0EsQ0FBQSxDQUFBO2FBQ0E7U0FDQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUNiQSxHQUFBLENBQUEsT0FBQSxDQUFBLGNBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUEsUUFBQSxFQUFBLGFBQUEsRUFBQTtBQUNBLFFBQUEsT0FBQSxHQUFBLFNBQUEsT0FBQSxDQUFBLElBQUEsRUFBQTtBQUNBLHFCQUFBLENBQUEsT0FBQSxDQUFBLElBQUEsRUFBQSxHQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7QUFDQSxXQUFBO0FBQ0EsbUJBQUEsRUFBQSxxQkFBQSxLQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsSUFBQSxDQUFBLGNBQUEsRUFBQSxLQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsS0FBQSxFQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsU0FDQSxDQUFBLFVBQUEsQ0FBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxLQUFBLENBQUEsb0JBQUEsRUFBQSxDQUFBLENBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUVBO0FBQ0EsZ0JBQUEsRUFBQSxvQkFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsY0FBQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBO0FBQ0EsbUJBQUEsRUFBQSxxQkFBQSxLQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsSUFBQSxDQUFBLG9CQUFBLEVBQUEsS0FBQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBO0FBQ0EsZ0JBQUEsRUFBQSxrQkFBQSxPQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLGNBQUEsR0FBQSxPQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7QUFDQSxzQkFBQSxFQUFBLHdCQUFBLE1BQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsbUJBQUEsR0FBQSxNQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7QUFDQSxnQkFBQSxFQUFBLGtCQUFBLE9BQUEsRUFBQSxPQUFBLEVBQUE7QUFDQSxnQkFBQSxHQUFBLEdBQUEsRUFBQSxDQUFBO0FBQ0EsZUFBQSxDQUFBLE9BQUEsR0FBQSxPQUFBLENBQUE7QUFDQSxlQUFBLENBQUEsT0FBQSxHQUFBLE9BQUEsQ0FBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsc0JBQUEsRUFBQSxHQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7QUFDQSxtQkFBQSxFQUFBLHFCQUFBLE9BQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsVUFBQSxDQUFBLGNBQUEsR0FBQSxPQUFBLENBQUEsQ0FBQTtTQUNBO0FBQ0EsMEJBQUEsRUFBQSw0QkFBQSxPQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLHFCQUFBLEdBQUEsT0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDM0RBLEdBQUEsQ0FBQSxPQUFBLENBQUEsZUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsV0FBQTtBQUNBLGdCQUFBLEVBQUEsa0JBQUEsR0FBQSxFQUFBO0FBQ0EsZ0JBQUEsS0FBQSxHQUFBO0FBQ0EsbUJBQUEsRUFBQSxHQUFBO0FBQ0Esb0JBQUEsRUFBQSxNQUFBO2FBQ0EsQ0FBQTtBQUNBLGlCQUFBLENBQUEsSUFBQSxDQUFBLGlCQUFBLEVBQUEsS0FBQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBLEVBQ0EsQ0FBQSxDQUFBO1NBQ0E7QUFDQSxpQkFBQSxFQUFBLG1CQUFBLEtBQUEsRUFBQTtBQUNBLGlCQUFBLENBQUEsSUFBQSxDQUFBLG9CQUFBLEVBQUEsS0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7QUFDQSxnQkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxhQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7QUFDQSxnQkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxxQkFBQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBO0FBQ0EsZ0JBQUEsRUFBQSxvQkFBQTtBQUNBLGlCQUFBLENBQUEsR0FBQSxDQUFBLHNCQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxDQUFBLEdBQUEsQ0FBQSxZQUFBLEVBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7QUFDQSxpQkFBQSxFQUFBLHFCQUFBO0FBQ0EsaUJBQUEsQ0FBQSxHQUFBLENBQUEsdUJBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLE9BQUEsRUFBQSxHQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTtBQUNBLGlCQUFBLEVBQUEsbUJBQUEsTUFBQSxFQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxxQkFBQSxHQUFBLE1BQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLE9BQUEsRUFBQSxHQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDOUNBLEdBQUEsQ0FBQSxPQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLFVBQUEsRUFBQSxhQUFBLEVBQUE7QUFDQSxXQUFBO0FBQ0EsbUJBQUEsRUFBQSx1QkFBQTtBQUNBLGdCQUFBLElBQUEsR0FBQTtBQUNBLG9CQUFBLEVBQUEsTUFBQTtBQUNBLHVCQUFBLEVBQUEsV0FBQTtBQUNBLHNCQUFBLEVBQUEsQ0FBQSxLQUFBLEVBQUEsS0FBQSxFQUFBLE9BQUEsQ0FBQTthQUNBLENBQUE7QUFDQSxtQkFBQSxJQUFBLENBQUE7O1NBRUE7QUFDQSxrQkFBQSxFQUFBLG9CQUFBLElBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsYUFBQSxFQUFBLElBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTtBQUNBLGVBQUEsRUFBQSxtQkFBQTtBQUNBLGdCQUFBLFFBQUEsR0FBQSxhQUFBLENBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLGFBQUEsR0FBQSxRQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSwwQkFBQSxDQUFBLElBQUEsR0FBQSxHQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBOztBQUVBLG1CQUFBLEVBQUEscUJBQUEsS0FBQSxFQUFBO0FBQ0EsZ0JBQUEsSUFBQSxHQUFBLFVBQUEsQ0FBQSxJQUFBLENBQUE7QUFDQSxnQkFBQSxJQUFBLENBQUEsTUFBQSxDQUFBLE9BQUEsRUFBQSxLQUFBLENBQUEsQ0FBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsc0JBQUEsQ0FBQSxDQUFBO2FBQ0E7QUFDQSxnQkFBQSxDQUFBLE1BQUEsQ0FBQSxJQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7O0FBRUEsaUJBQUEsQ0FBQSxJQUFBLENBQUEsbUJBQUEsRUFBQSxJQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxvQkFBQSxHQUFBLENBQUEsTUFBQSxLQUFBLEdBQUEsRUFBQTtBQUNBLGlDQUFBLENBQUEsT0FBQSxDQUFBLGlCQUFBLEVBQUEsSUFBQSxDQUFBLENBQUE7aUJBQ0EsTUFDQTtBQUNBLGlDQUFBLENBQUEsT0FBQSxDQUFBLGdCQUFBLEVBQUEsSUFBQSxDQUFBLENBQUE7aUJBQ0E7YUFDQSxDQUFBLENBQUE7U0FDQTtBQUNBLG1CQUFBLEVBQUEscUJBQUEsS0FBQSxFQUFBO0FBQ0EsZ0JBQUEsSUFBQSxHQUFBLFVBQUEsQ0FBQSxJQUFBLENBQUE7QUFDQSxnQkFBQSxJQUFBLENBQUEsTUFBQSxDQUFBLE9BQUEsRUFBQSxLQUFBLENBQUEsQ0FBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsc0JBQUEsQ0FBQSxDQUFBO2FBQ0E7QUFDQSxnQkFBQSxDQUFBLE1BQUEsQ0FBQSxJQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7O0FBRUEsaUJBQUEsQ0FBQSxJQUFBLENBQUEsbUJBQUEsRUFBQSxJQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxvQkFBQSxHQUFBLENBQUEsTUFBQSxLQUFBLEdBQUEsRUFBQTtBQUNBLGlDQUFBLENBQUEsT0FBQSxDQUFBLGlCQUFBLEVBQUEsSUFBQSxDQUFBLENBQUE7aUJBQ0EsTUFDQTtBQUNBLGlDQUFBLENBQUEsT0FBQSxDQUFBLGdCQUFBLEVBQUEsSUFBQSxDQUFBLENBQUE7aUJBQ0E7YUFDQSxDQUFBLENBQUE7U0FDQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUN6REEsR0FBQSxDQUFBLE9BQUEsQ0FBQSxlQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsU0FBQSxFQUFBLFFBQUEsRUFBQTs7QUFHQSxRQUFBLFVBQUEsR0FBQSxTQUFBLFVBQUEsQ0FBQSxPQUFBLEVBQUE7QUFDQSxZQUFBLFFBQUEsR0FBQSxPQUFBLENBQUEsT0FBQSxDQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTtBQUNBLGlCQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0Esa0JBQUEsRUFBQSxRQUFBO0FBQ0Esb0JBQUEsRUFDQSxrREFBQSxHQUNBLHVCQUFBLEdBQ0EsT0FBQSxHQUNBLHdCQUFBLEdBQ0EsY0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBR0EsV0FBQTtBQUNBLGVBQUEsRUFBQSxpQkFBQSxPQUFBLEVBQUEsT0FBQSxFQUFBO0FBQ0Esc0JBQUEsQ0FBQSxPQUFBLENBQUEsQ0FBQTtBQUNBLG9CQUFBLENBQUEsWUFBQTtBQUNBLHlCQUFBLENBQUEsSUFBQSxFQUFBLENBQUE7YUFDQSxFQUFBLE9BQUEsQ0FBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBO0NBSUEsQ0FBQSxDQUFBO0FDNUJBLEdBQUEsQ0FBQSxTQUFBLENBQUEsUUFBQSxFQUFBLFlBQUE7QUFDQSxXQUFBO0FBQ0EsZ0JBQUEsRUFBQSxHQUFBO0FBQ0EsWUFBQSxFQUFBLGNBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxJQUFBLEVBQUE7QUFDQSxnQkFBQSxJQUFBLEdBQUEsSUFBQSxDQUFBLE1BQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7O0FBRUEsZ0JBQUEsSUFBQSxDQUFBLEdBQUEsRUFBQTtBQUNBLG9CQUFBLElBQUEsQ0FBQSxDQUFBLENBQUEsQ0FBQSxNQUFBLEVBQUE7QUFDQSwyQkFBQSxDQUFBLEdBQUEsQ0FBQTtBQUNBLDZCQUFBLEVBQUEsSUFBQSxDQUFBLENBQUEsQ0FBQSxHQUFBLElBQUE7cUJBQ0EsQ0FBQSxDQUFBO2lCQUNBOztBQUVBLG9CQUFBLElBQUEsQ0FBQSxDQUFBLENBQUEsQ0FBQSxNQUFBLEVBQUE7QUFDQSwyQkFBQSxDQUFBLEdBQUEsQ0FBQTtBQUNBLDhCQUFBLEVBQUEsSUFBQSxDQUFBLENBQUEsQ0FBQSxHQUFBLElBQUE7cUJBQ0EsQ0FBQSxDQUFBO2lCQUNBO2FBQ0EsTUFBQTtBQUNBLG9CQUFBLElBQUEsQ0FBQSxDQUFBLENBQUEsQ0FBQSxNQUFBLEVBQUE7QUFDQSwyQkFBQSxDQUFBLEdBQUEsQ0FBQTtBQUNBLG1DQUFBLEVBQUEsSUFBQSxDQUFBLENBQUEsQ0FBQSxHQUFBLElBQUE7cUJBQ0EsQ0FBQSxDQUFBO2lCQUNBOztBQUVBLG9CQUFBLElBQUEsQ0FBQSxDQUFBLENBQUEsQ0FBQSxNQUFBLEVBQUE7QUFDQSwyQkFBQSxDQUFBLEdBQUEsQ0FBQTtBQUNBLG9DQUFBLEVBQUEsSUFBQSxDQUFBLENBQUEsQ0FBQSxHQUFBLElBQUE7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QUFBLENBQUEsQ0FBQTthQUNBLENBQUE7QUFDQSxpQkFBQSxDQUFBLE1BQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBO0FBQ0EsOEJBQUEsRUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7O0tBRUEsQ0FBQTtDQUNBLENBQUEsQ0FBQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xud2luZG93LmFwcCA9IGFuZ3VsYXIubW9kdWxlKCdaVEYnLCBbJ2ZzYVByZUJ1aWx0JywnYm9vdHN0cmFwTGlnaHRib3gnLCAndWkucm91dGVyJywgJ3VpLmJvb3RzdHJhcCcsICduZ0FuaW1hdGUnLCAnYW5ndWxhckZpbGVVcGxvYWQnLCAnbmdNYXRlcmlhbCcsICdha29lbmlnLmRlY2tncmlkJ10pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkbWRUaGVtaW5nUHJvdmlkZXIpIHtcbiAgICAvLyBUaGlzIHR1cm5zIG9mZiBoYXNoYmFuZyB1cmxzICgvI2Fib3V0KSBhbmQgY2hhbmdlcyBpdCB0byBzb21ldGhpbmcgbm9ybWFsICgvYWJvdXQpXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuICAgIC8vIElmIHdlIGdvIHRvIGEgVVJMIHRoYXQgdWktcm91dGVyIGRvZXNuJ3QgaGF2ZSByZWdpc3RlcmVkLCBnbyB0byB0aGUgXCIvXCIgdXJsLlxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcbiAgICAgdmFyIGN1c3RvbVByaW1hcnkgPSB7XG4gICAgICAgICc1MCc6ICcjZDhiZjhjJyxcbiAgICAgICAgJzEwMCc6ICcjZDFiNTc5JyxcbiAgICAgICAgJzIwMCc6ICcjY2JhYTY2JyxcbiAgICAgICAgJzMwMCc6ICcjYzRhMDUzJyxcbiAgICAgICAgJzQwMCc6ICcjYmQ5NTQwJyxcbiAgICAgICAgJzUwMCc6ICcjYWE4NjNhJyxcbiAgICAgICAgJzYwMCc6ICcjOTc3NzM0JyxcbiAgICAgICAgJzcwMCc6ICcjODQ2ODJkJyxcbiAgICAgICAgJzgwMCc6ICcjNzE1OTI3JyxcbiAgICAgICAgJzkwMCc6ICcjNWU0YTIwJyxcbiAgICAgICAgJ0ExMDAnOiAnI2RlY2E5ZicsXG4gICAgICAgICdBMjAwJzogJyNlNWQ0YjInLFxuICAgICAgICAnQTQwMCc6ICcjZWJkZmM1JyxcbiAgICAgICAgJ0E3MDAnOiAnIzRiM2IxYSdcbiAgICB9O1xuICBcblxuICAgJG1kVGhlbWluZ1Byb3ZpZGVyLnRoZW1lKCdkZWZhdWx0JylcbiAgICAgICAucHJpbWFyeVBhbGV0dGUoJ2JsdWUnKVxuICAgICAgIC5hY2NlbnRQYWxldHRlKCdwdXJwbGUnKVxuICAgICAgIC53YXJuUGFsZXR0ZSgneWVsbG93Jylcbn0pO1xuXG4vLyBUaGlzIGFwcC5ydW4gaXMgZm9yIGNvbnRyb2xsaW5nIGFjY2VzcyB0byBzcGVjaWZpYyBzdGF0ZXMuXG5hcHAucnVuKGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxuICAgIHZhciBkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5kYXRhICYmIHN0YXRlLmRhdGEuYXV0aGVudGljYXRlO1xuICAgIH07XG5cbiAgICAvLyAkc3RhdGVDaGFuZ2VTdGFydCBpcyBhbiBldmVudCBmaXJlZFxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMpIHtcblxuICAgICAgICBpZiAoIWRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgodG9TdGF0ZSkpIHtcbiAgICAgICAgICAgIC8vIFRoZSBkZXN0aW5hdGlvbiBzdGF0ZSBkb2VzIG5vdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICAvLyBUaGUgdXNlciBpcyBhdXRoZW50aWNhdGVkLlxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbmNlbCBuYXZpZ2F0aW5nIHRvIG5ldyBzdGF0ZS5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAvLyBJZiBhIHVzZXIgaXMgcmV0cmlldmVkLCB0aGVuIHJlbmF2aWdhdGUgdG8gdGhlIGRlc3RpbmF0aW9uXG4gICAgICAgICAgICAvLyAodGhlIHNlY29uZCB0aW1lLCBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSB3aWxsIHdvcmspXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UsIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLCBnbyB0byBcImxvZ2luXCIgc3RhdGUuXG4gICAgICAgICAgICAvLyRyb290U2NvcGUubG9nZ2VkSW5Vc2VyID0gdXNlcjtcbiAgICAgICAgICAgIC8vIGlmICh1c2VyKSB7XG4gICAgICAgICAgICAvLyAgICAgJHN0YXRlLmdvKHRvU3RhdGUubmFtZSwgdG9QYXJhbXMpO1xuICAgICAgICAgICAgLy8gfSBlbHNlIHtcbiAgICAgICAgICAgIC8vICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbn0pO1xuIiwiYXBwLmNvbnRyb2xsZXIoXCJBZG1pbkN0cmxcIiwgKCRzY29wZSwgJHN0YXRlLCBBZG1pbkZhY3RvcnksIEFsYnVtRmFjdG9yeSwgUGhvdG9zRmFjdG9yeSkgPT4ge1xuICAgICRzY29wZS5hZGRpbmdQaWN0dXJlcyA9IGZhbHNlO1xuXG4gICAgQWxidW1GYWN0b3J5LmZldGNoQWxsKClcbiAgICAgICAgLnRoZW4oYWxidW1zID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdmZXRjaGVkJywgYWxidW1zKTtcbiAgICAgICAgICAgICRzY29wZS5hbGJ1bXMgPSBhbGJ1bXM7XG4gICAgICAgICAgICAkc2NvcGUuYWxidW1PbmUgPSAkc2NvcGUuYWxidW1zWzBdO1xuICAgICAgICB9KTtcblxuICAgIFBob3Rvc0ZhY3RvcnkuZmV0Y2hUZW4oKVxuICAgICAgICAudGhlbihwaG90b3MgPT4ge1xuICAgICAgICAgICAgJHNjb3BlLnBob3RvcyA9IHBob3RvcztcbiAgICAgICAgfSk7XG5cbiAgICAkc2NvcGUuZGVsZXRlQWxidW0gPSAoYWxidW0pID0+IHtcbiAgICAgICAgQWxidW1GYWN0b3J5LmRlbGV0ZUFsYnVtKGFsYnVtLl9pZCk7XG4gICAgICAgIGxldCBhbGJ1bUluZGV4ID0gJHNjb3BlLmFsYnVtcy5pbmRleE9mKGFsYnVtKTtcbiAgICAgICAgJHNjb3BlLmFsYnVtcy5zcGxpY2UoYWxidW1JbmRleCwgMSk7XG4gICAgfVxuXG4gICAgJHNjb3BlLmNyZWF0ZUFsYnVtID0gKCkgPT4ge1xuICAgICAgICBsZXQgYWxidW0gPSB7XG4gICAgICAgICAgICB0aXRsZTogJHNjb3BlLm5ld0FsYnVtXG4gICAgICAgIH1cbiAgICAgICAgQWxidW1GYWN0b3J5LmNyZWF0ZUFsYnVtKGFsYnVtKS50aGVuKGFsYnVtID0+IHtcbiAgICAgICAgICAgICRzY29wZS5hbGJ1bXMucHVzaChhbGJ1bSk7XG4gICAgICAgICAgICAkc2NvcGUubmV3QWxidW0gPSBcIlwiO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgICRzY29wZS5hZGRQaG90b3MgPSAoYWxidW0pID0+IHtcbiAgICAgICAgJHNjb3BlLnNlbGVjdGluZ1BpY3R1cmVzID0gdHJ1ZTtcbiAgICAgICAgJHNjb3BlLmN1cnJlbnRBbGJ1bSA9IGFsYnVtO1xuICAgICAgICBQaG90b3NGYWN0b3J5LmZldGNoQWxsKClcbiAgICAgICAgICAgIC50aGVuKHBob3RvcyA9PiB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnBob3RvcyA9IHBob3RvcztcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgICRzY29wZS52aWV3QWxidW0gPSAoYWxidW0pID0+IHtcbiAgICBcdCRzdGF0ZS5nbygnc2luZ2xlQWxidW0nLCB7YWxidW1JZDogYWxidW0uX2lkfSlcbiAgICB9XG5cblxuICAgICRzY29wZS51cGRhdGVBbGJ1bSA9ICgpID0+IHtcbiAgICAgICAgQWxidW1GYWN0b3J5LnVwZGF0ZUFsYnVtKCRzY29wZS5jdXJyZW50QWxidW0pLnRoZW4ocmVzID0+IHtcbiAgICAgICAgXHQkc3RhdGUucmVsb2FkKCk7XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgJHNjb3BlLnVwbG9hZFBob3RvcyA9ICgpID0+IHtcbiAgICAgICAgJHN0YXRlLmdvKCd1cGxvYWRQaG90b3MnKTtcbiAgICB9XG5cbiAgICAkc2NvcGUuYWRkVG9BbGJ1bSA9IChwaG90bykgPT4ge1xuICAgICAgICAkc2NvcGUuY3VycmVudEFsYnVtLnBob3Rvcy5wdXNoKHBob3RvLl9pZCk7XG4gICAgfVxufSkiLCJhcHAuZmFjdG9yeShcIkFkbWluRmFjdG9yeVwiLCAoJGh0dHApID0+IHtcblx0cmV0dXJuIHtcblx0XHRcblx0fVxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4nLCB7XG4gICAgICAgIHVybDogJy9hZG1pbicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvYWRtaW4vYWRtaW4uaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdBbGJ1bUN0cmwnLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBhdXRoZW50aWNhdGU6IHRydWVcbiAgICAgICAgfVxuICAgIH0pO1xufSk7IiwiYXBwLmNvbnRyb2xsZXIoJ0FsYnVtQ3RybCcsICgkc2NvcGUsICR0aW1lb3V0LCAkc3RhdGUsIEFkbWluRmFjdG9yeSwgQWxidW1GYWN0b3J5LCBQaG90b3NGYWN0b3J5LCBEaWFsb2dGYWN0b3J5KSA9PiB7XG4gICAgJHNjb3BlLmFkZGluZ1BpY3R1cmVzID0gZmFsc2U7XG5cbiAgICBBbGJ1bUZhY3RvcnkuZmV0Y2hBbGwoKVxuICAgICAgICAudGhlbihhbGJ1bXMgPT4ge1xuICAgICAgICAgICAgJHNjb3BlLmFsYnVtcyA9IGFsYnVtcztcbiAgICAgICAgICAgICRzY29wZS5hbGJ1bU9uZSA9ICRzY29wZS5hbGJ1bXNbMF07XG4gICAgICAgIH0pO1xuXG4gICAgUGhvdG9zRmFjdG9yeS5mZXRjaFRlbigpXG4gICAgICAgIC50aGVuKHBob3RvcyA9PiB7XG4gICAgICAgICAgICAkc2NvcGUucGhvdG9zID0gcGhvdG9zO1xuICAgICAgICB9KTtcblxuICAgICRzY29wZS5kZWxldGVBbGJ1bSA9IChhbGJ1bSkgPT4ge1xuICAgICAgICBBbGJ1bUZhY3RvcnkuZGVsZXRlQWxidW0oYWxidW0uX2lkKTtcbiAgICAgICAgbGV0IGFsYnVtSW5kZXggPSAkc2NvcGUuYWxidW1zLmluZGV4T2YoYWxidW0pO1xuICAgICAgICAkc2NvcGUuYWxidW1zLnNwbGljZShhbGJ1bUluZGV4LCAxKTtcbiAgICB9XG5cbiAgICAkc2NvcGUuY3JlYXRlQWxidW0gPSAoKSA9PiB7XG4gICAgICAgIGxldCBhbGJ1bSA9IHtcbiAgICAgICAgICAgIHRpdGxlOiAkc2NvcGUubmV3QWxidW1cbiAgICAgICAgfVxuICAgICAgICBBbGJ1bUZhY3RvcnkuY3JlYXRlQWxidW0oYWxidW0pLnRoZW4oYWxidW0gPT4ge1xuICAgICAgICAgICAgRGlhbG9nRmFjdG9yeS5kaXNwbGF5KFwiQ3JlYXRlZFwiKTtcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICAkc2NvcGUuYWRkUGhvdG9zID0gKGFsYnVtKSA9PiB7XG4gICAgICAgICRzY29wZS5zZWxlY3RpbmdQaWN0dXJlcyA9IHRydWU7XG4gICAgICAgICRzY29wZS5jdXJyZW50QWxidW0gPSBhbGJ1bTtcbiAgICAgICAgUGhvdG9zRmFjdG9yeS5mZXRjaEFsbCgpXG4gICAgICAgICAgICAudGhlbihwaG90b3MgPT4ge1xuICAgICAgICAgICAgICAgICRzY29wZS5waG90b3MgPSBwaG90b3M7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAkc2NvcGUudmlld0FsYnVtID0gKGFsYnVtKSA9PiB7XG5cbiAgICB9XG5cblxuICAgICRzY29wZS51cGRhdGVBbGJ1bSA9ICgpID0+IHtcbiAgICAgICAgQWxidW1GYWN0b3J5LnVwZGF0ZUFsYnVtKCRzY29wZS5jdXJyZW50QWxidW0pLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgIERpYWxvZ0ZhY3RvcnkuZGlzcGxheShcIlVwZGF0ZWRcIiwgMTUwMCk7XG4gICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUucmVsb2FkKCk7XG4gICAgICAgICAgICB9LCAxMDAwKTtcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICAkc2NvcGUudmlld0FsYnVtID0gKGFsYnVtKSA9PiB7XG4gICAgICAgICRzdGF0ZS5nbygnc2luZ2xlQWxidW0nLCB7YWxidW1JZDogYWxidW0uX2lkfSlcbiAgICB9XG5cbiAgICAkc2NvcGUuYWRkVG9BbGJ1bSA9IChwaG90bykgPT4ge1xuICAgICAgICAkc2NvcGUuY3VycmVudEFsYnVtLnBob3Rvcy5wdXNoKHBob3RvLl9pZCk7XG4gICAgICAgIERpYWxvZ0ZhY3RvcnkuZGlzcGxheShcIkFkZGVkXCIsIDEwMDApO1xuICAgIH1cblxuXG5cbn0pIiwiXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaW5nbGVBbGJ1bScsIHtcbiAgICAgICAgdXJsOiAnL0FsYnVtLzphbGJ1bUlkJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hbGJ1bS9zaW5nbGUtYWxidW0uaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdTaW5nbGVBbGJ1bUN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0YWxidW06IChBbGJ1bUZhY3RvcnksICRzdGF0ZVBhcmFtcykgPT4ge1xuICAgICAgICBcdFx0cmV0dXJuIEFsYnVtRmFjdG9yeS5mZXRjaE9uZSgkc3RhdGVQYXJhbXMuYWxidW1JZClcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICAgIFxuICAgIH0pO1xufSk7XG4iLCJhcHAuY29udHJvbGxlcignQWxidW1zQ3RybCcsICgkc2NvcGUsICRzdGF0ZSwgUGhvdG9zRmFjdG9yeSwgQWxidW1GYWN0b3J5LCBVc2VyRmFjdG9yeSwgRGlhbG9nRmFjdG9yeSkgPT4ge1xuXHRBbGJ1bUZhY3RvcnkuZmV0Y2hBbGwoKVxuICAgICAgICAudGhlbihhbGJ1bXMgPT4ge1xuICAgICAgICAgICAgJHNjb3BlLmFsYnVtcyA9IGFsYnVtcztcbiAgICAgICAgICAgICRzY29wZS5hbGJ1bU9uZSA9ICRzY29wZS5hbGJ1bXNbMF07XG4gICAgICAgIH0pO1xuXG4gICAgJHNjb3BlLnZpZXdBbGJ1bSA9IChhbGJ1bSkgPT4ge1xuICAgICAgICAkc3RhdGUuZ28oJ3NpbmdsZUFsYnVtJywge2FsYnVtSWQ6IGFsYnVtLl9pZH0pXG4gICAgfVxuXG4gICAgJHNjb3BlLmZvbGxvd0FsYnVtID0gKGFsYnVtKSA9PiB7XG4gICAgXHRVc2VyRmFjdG9yeS5mb2xsb3dBbGJ1bShhbGJ1bSlcbiAgICB9XG5cbiAgICAkc2NvcGUuY3JlYXRlQWxidW0gPSAoKSA9PiB7XG4gICAgICAgICRzdGF0ZS5nbygnbmV3QWxidW0nKTtcbiAgICAgICAgLy8gbGV0IGFsYnVtID0ge1xuICAgICAgICAvLyAgICAgdGl0bGU6ICRzY29wZS5uZXdBbGJ1bVxuICAgICAgICAvLyB9XG4gICAgICAgIC8vIEFsYnVtRmFjdG9yeS5jcmVhdGVBbGJ1bShhbGJ1bSkudGhlbihhbGJ1bSA9PiB7XG4gICAgICAgIC8vICAgICBEaWFsb2dGYWN0b3J5LmRpc3BsYXkoXCJDcmVhdGVkXCIpO1xuICAgICAgICAvLyB9KVxuICAgIH1cblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWxidW1zJywge1xuICAgICAgICB1cmw6ICcvYWxidW1zJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hbGJ1bS9hbGJ1bXMuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdBbGJ1bXNDdHJsJ1xuICAgIH0pO1xufSk7IiwiYXBwLmNvbmZpZygoJHN0YXRlUHJvdmlkZXIpID0+IHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2VkaXRBbGJ1bScsIHtcblx0XHR1cmw6ICcvZWRpdEFsYnVtLzphbGJ1bUlkJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL2FsYnVtL2VkaXQtYWxidW0uaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ0VkaXRBbGJ1bUN0cmwnLFxuXHRcdHJlc29sdmU6IHtcblx0XHRcdGFsYnVtOiAoQWxidW1GYWN0b3J5LCAkc3RhdGVQYXJhbXMpID0+IHtcblx0XHRcdFx0cmV0dXJuIEFsYnVtRmFjdG9yeS5mZXRjaE9uZSgkc3RhdGVQYXJhbXMuYWxidW1JZClcblx0XHRcdH1cblx0XHR9XG5cdH0pXG59KTtcblxuXG5hcHAuY29udHJvbGxlcignRWRpdEFsYnVtQ3RybCcsICgkc2NvcGUsIEFsYnVtRmFjdG9yeSwgUGhvdG9zRmFjdG9yeSwgRGlhbG9nRmFjdG9yeSwgYWxidW0pID0+IHtcblx0JHNjb3BlLmFkZGluZ1BpY3R1cmVzID0gZmFsc2U7XG5cblx0bGV0IHNldERhdGUgPSAoKSA9PiB7XG5cdFx0YWxidW0uZGF0ZSA9IG5ldyBEYXRlKGFsYnVtLmRhdGUpO1xuXHRcdCRzY29wZS5hbGJ1bSA9IGFsYnVtO1xuXHR9XG5cdHNldERhdGUoKTtcblxuXHQkc2NvcGUuc2F2ZUFsYnVtID0oKSA9PiB7XG5cdFx0QWxidW1GYWN0b3J5LnVwZGF0ZUFsYnVtKCRzY29wZS5hbGJ1bSlcblx0XHQudGhlbihyZXMgPT4ge1xuXHRcdFx0JHNjb3BlLmFsYnVtID0gcmVzO1xuXHRcdFx0JHNjb3BlLnNlbGVjdGluZ1BpY3R1cmVzID0gZmFsc2U7XG5cdFx0XHREaWFsb2dGYWN0b3J5LmRpc3BsYXkoJ1NhdmVkJywgMTAwMCk7XG5cdFx0fSlcblx0fVxuXG5cdCRzY29wZS5hZGRQaG90b3MgPSAoKSA9PiB7XG5cdFx0Y29uc29sZS5sb2coJ2FkZGluZycpO1xuXHRcdFBob3Rvc0ZhY3RvcnkuZmV0Y2hBbGwoKS50aGVuKHBob3RvcyA9PiB7XG5cdFx0XHRjb25zb2xlLmxvZygncGhvdG9zJywgcGhvdG9zKTtcblx0XHRcdCRzY29wZS5zZWxlY3RpbmdQaWN0dXJlcyA9IHRydWU7XG5cdFx0XHQkc2NvcGUucGhvdG9zID0gcGhvdG9zO1xuXHRcdH0pXG5cdH1cblxuXHQkc2NvcGUuYWRkVG9BbGJ1bSA9IChwaG90bykgPT4ge1xuXHRcdGNvbnNvbGUubG9nKFwiYWRkZWRcIiwgcGhvdG8pO1xuICAgICAgICAkc2NvcGUuYWxidW0ucGhvdG9zLnB1c2gocGhvdG8uX2lkKTtcbiAgICAgICAgQWxidW1GYWN0b3J5LmFkZFBob3RvKGFsYnVtLl9pZCwgcGhvdG8uX2lkKVxuICAgIH1cbn0pIiwiYXBwLmNvbnRyb2xsZXIoJ05ld0FsYnVtQ3RybCcsICgkc2NvcGUsICRzdGF0ZSwgQWxidW1GYWN0b3J5LCBQaG90b3NGYWN0b3J5LCBTZXNzaW9uLCBEaWFsb2dGYWN0b3J5LCBBdXRoU2VydmljZSkgPT4ge1xuXHRjb25zb2xlLmxvZygnU2Vzc2lvbicsIFNlc3Npb24pO1xuXHQkc2NvcGUuc2hvd1Bob3RvcyA9IGZhbHNlO1xuXG5cdCRzY29wZS5jcmVhdGVBbGJ1bSA9ICgpID0+IHtcbiAgICAgICAgaWYoU2Vzc2lvbi51c2VyKSB7XG5cdFx0ICAkc2NvcGUuYWxidW0ub3duZXIgPSBTZXNzaW9uLnVzZXIuX2lkO1xuICAgICAgICB9XG5cdFx0Y29uc29sZS5sb2coJHNjb3BlLmFsYnVtKTtcblxuICAgICAgICBBbGJ1bUZhY3RvcnkuY3JlYXRlQWxidW0oJHNjb3BlLmFsYnVtKVxuICAgIH1cblxuXG5cbiAgICAkc2NvcGUuYWRkVG9BbGJ1bSA9IChwaG90bykgPT4ge1xuICAgIFx0RGlhbG9nRmFjdG9yeS5kaXNwbGF5KCdBZGRlZCcsIDc1MCk7XG4gICAgICAgICRzY29wZS5hbGJ1bS5waG90b3MucHVzaChwaG90byk7XG4gICAgICAgICRzY29wZS5hbGJ1bS5jb3ZlciA9IHBob3RvO1xuICAgIH1cblxuICAgICRzY29wZS5zYXZlQWxidW0gPSAoKSA9PiB7XG4gICAgXHRBbGJ1bUZhY3RvcnkudXBkYXRlQWxidW0oJHNjb3BlLmFsYnVtKS50aGVuKGFsYnVtID0+IHtcbiAgICBcdFx0JHN0YXRlLmdvKCdhbGJ1bXMnKTtcbiAgICBcdH0pXG4gICAgfVxufSk7IiwiYXBwLmNvbmZpZygoJHN0YXRlUHJvdmlkZXIpID0+IHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ25ld0FsYnVtJywge1xuXHRcdHVybDogJy9uZXdBbGJ1bScsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9hbGJ1bS9uZXctYWxidW0uaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ05ld0FsYnVtQ3RybCdcblx0fSlcbn0pO1xuXG4iLCJhcHAuY29udHJvbGxlcignU2luZ2xlQWxidW1DdHJsJywgKCRzY29wZSwgJHRpbWVvdXQsICRzdGF0ZSwgYWxidW0sIEFkbWluRmFjdG9yeSwgQWxidW1GYWN0b3J5LCBQaG90b3NGYWN0b3J5KSA9PiB7XG5cdCRzY29wZS5hbGJ1bSA9IGFsYnVtO1xuXHQkc2NvcGUuc2VsZWN0aW5nQ292ZXIgPSBmYWxzZTtcblx0JHNjb3BlLmNoYW5nZXNNYWRlID0gZmFsc2U7XG5cdCRzY29wZS5yZW1vdmVQaG90b3MgPSBmYWxzZTtcblxuXG5cdGNvbnNvbGUubG9nKFwicGhvdG9zOiBcIiwgYWxidW0ucGhvdG9zKTtcblx0JHNjb3BlLnBob3RvcyA9IGFsYnVtLnBob3Rvcztcblx0JHNjb3BlLnJlbW92ZUZyb21BbGJ1bSA9IChwaG90bykgPT4ge1xuXHRcdGxldCBwaG90b0luZGV4ID0gJHNjb3BlLmFsYnVtLnBob3Rvcy5pbmRleE9mKHBob3RvKTtcblx0XHQkc2NvcGUuYWxidW0ucGhvdG9zLnNwbGljZShwaG90b0luZGV4LCAxKTtcblx0fVxuXG5cdCRzY29wZS5kZWxldGVQaG90b3MgPSAoKSA9PiB7XG5cdFx0JHNjb3BlLnJlbW92ZVBob3RvcyA9IHRydWU7XG5cdH1cblxuXHQkc2NvcGUuc2VsZWN0Q292ZXIgPSAoKSA9PiB7XG5cdFx0JHRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0JHNjb3BlLnNlbGVjdGluZ0NvdmVyID0gdHJ1ZTtcblx0XHRcdCRzY29wZS5jaGFuZ2VzTWFkZSA9IHRydWU7XG5cdFx0fSwgNTAwKTtcblx0fVxuXG5cdCRzY29wZS5hZGRDb3ZlciA9IChwaG90bykgPT4ge1xuICAgICAgICAkc2NvcGUuYWxidW0uY292ZXIgPSBwaG90by5faWQ7XG4gICAgICAgICRzY29wZS5zZWxlY3RpbmdDb3ZlciA9IGZhbHNlO1xuICAgIH1cblxuXHQkc2NvcGUudXBkYXRlQWxidW0gPSAoKSA9PiB7XG4gICAgICAgIEFsYnVtRmFjdG9yeS51cGRhdGVBbGJ1bSgkc2NvcGUuYWxidW0pLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnYWRtaW4nKTtcbiAgICAgICAgfSlcbiAgICB9XG5cblxuICAgICRzY29wZS5mZXRjaFBob3RvcyA9ICgpID0+IHtcbiAgICBcdGNvbnNvbGUubG9nKFwiYWxidW06IFwiLCBhbGJ1bSk7XG4gICAgXHRBbGJ1bUZhY3RvcnkuZmV0Y2hQaG90b3NJbkFsYnVtKGFsYnVtLl9pZClcbiAgICBcdC50aGVuKGFsYnVtID0+IHtcbiAgICBcdFx0Y29uc29sZS5sb2coXCJyZXR1cm5lZDogXCIsIGFsYnVtKTtcbiAgICBcdH0pXG4gICAgfVxufSk7IiwiKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIEhvcGUgeW91IGRpZG4ndCBmb3JnZXQgQW5ndWxhciEgRHVoLWRveS5cbiAgICBpZiAoIXdpbmRvdy5hbmd1bGFyKSB0aHJvdyBuZXcgRXJyb3IoJ0kgY2FuXFwndCBmaW5kIEFuZ3VsYXIhJyk7XG5cbiAgICB2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2ZzYVByZUJ1aWx0JywgW10pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ1NvY2tldCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF3aW5kb3cuaW8pIHRocm93IG5ldyBFcnJvcignc29ja2V0LmlvIG5vdCBmb3VuZCEnKTtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5pbyh3aW5kb3cubG9jYXRpb24ub3JpZ2luKTtcbiAgICB9KTtcblxuICAgIC8vIEFVVEhfRVZFTlRTIGlzIHVzZWQgdGhyb3VnaG91dCBvdXIgYXBwIHRvXG4gICAgLy8gYnJvYWRjYXN0IGFuZCBsaXN0ZW4gZnJvbSBhbmQgdG8gdGhlICRyb290U2NvcGVcbiAgICAvLyBmb3IgaW1wb3J0YW50IGV2ZW50cyBhYm91dCBhdXRoZW50aWNhdGlvbiBmbG93LlxuICAgIGFwcC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xuICAgIH0pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ0F1dGhJbnRlcmNlcHRvcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkcSwgQVVUSF9FVkVOVFMpIHtcbiAgICAgICAgdmFyIHN0YXR1c0RpY3QgPSB7XG4gICAgICAgICAgICA0MDE6IEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsXG4gICAgICAgICAgICA0MDM6IEFVVEhfRVZFTlRTLm5vdEF1dGhvcml6ZWQsXG4gICAgICAgICAgICA0MTk6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LFxuICAgICAgICAgICAgNDQwOiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KHN0YXR1c0RpY3RbcmVzcG9uc2Uuc3RhdHVzXSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICBhcHAuY29uZmlnKGZ1bmN0aW9uICgkaHR0cFByb3ZpZGVyKSB7XG4gICAgICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goW1xuICAgICAgICAgICAgJyRpbmplY3RvcicsXG4gICAgICAgICAgICBmdW5jdGlvbiAoJGluamVjdG9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRpbmplY3Rvci5nZXQoJ0F1dGhJbnRlcmNlcHRvcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdBdXRoU2VydmljZScsIGZ1bmN0aW9uICgkaHR0cCwgU2Vzc2lvbiwgJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMsICRxLCAkc3RhdGUpIHtcbiAgICAgICAgZnVuY3Rpb24gb25TdWNjZXNzZnVsTG9naW4ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgIFNlc3Npb24uY3JlYXRlKGRhdGEuaWQsIGRhdGEudXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzKTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhLnVzZXI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVc2VzIHRoZSBzZXNzaW9uIGZhY3RvcnkgdG8gc2VlIGlmIGFuXG4gICAgICAgIC8vIGF1dGhlbnRpY2F0ZWQgdXNlciBpcyBjdXJyZW50bHkgcmVnaXN0ZXJlZC5cbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISFTZXNzaW9uLnVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRMb2dnZWRJblVzZXIgPSBmdW5jdGlvbiAoZnJvbVNlcnZlcikge1xuXG4gICAgICAgICAgICAvLyBJZiBhbiBhdXRoZW50aWNhdGVkIHNlc3Npb24gZXhpc3RzLCB3ZVxuICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSB1c2VyIGF0dGFjaGVkIHRvIHRoYXQgc2Vzc2lvblxuICAgICAgICAgICAgLy8gd2l0aCBhIHByb21pc2UuIFRoaXMgZW5zdXJlcyB0aGF0IHdlIGNhblxuICAgICAgICAgICAgLy8gYWx3YXlzIGludGVyZmFjZSB3aXRoIHRoaXMgbWV0aG9kIGFzeW5jaHJvbm91c2x5LlxuXG4gICAgICAgICAgICAvLyBPcHRpb25hbGx5LCBpZiB0cnVlIGlzIGdpdmVuIGFzIHRoZSBmcm9tU2VydmVyIHBhcmFtZXRlcixcbiAgICAgICAgICAgIC8vIHRoZW4gdGhpcyBjYWNoZWQgdmFsdWUgd2lsbCBub3QgYmUgdXNlZC5cblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBdXRoZW50aWNhdGVkKCkgJiYgZnJvbVNlcnZlciAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKFNlc3Npb24udXNlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE1ha2UgcmVxdWVzdCBHRVQgL3Nlc3Npb24uXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgdXNlciwgY2FsbCBvblN1Y2Nlc3NmdWxMb2dpbiB3aXRoIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSA0MDEgcmVzcG9uc2UsIHdlIGNhdGNoIGl0IGFuZCBpbnN0ZWFkIHJlc29sdmUgdG8gbnVsbC5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9zZXNzaW9uJykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbikuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ2luID0gZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2xvZ2luJywgY3JlZGVudGlhbHMpXG4gICAgICAgICAgICAgICAgLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdCh7IG1lc3NhZ2U6ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLicgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvbG9nb3V0JykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgU2Vzc2lvbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdTZXNzaW9uJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFVVEhfRVZFTlRTKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24gKHNlc3Npb25JZCwgdXNlcikge1xuICAgICAgICAgICAgdGhpcy5pZCA9IHNlc3Npb25JZDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbn0pKCk7XG4iLCJhcHAuY29uZmlnKCgkc3RhdGVQcm92aWRlcikgPT4ge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnbG9naW4nLHtcblx0XHR1cmw6ICcvbG9naW4nLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvYXV0aC9sb2dpbi5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnTG9naW5DdHJsJ1xuXHR9KVxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdMb2dpbkN0cmwnLCAoJHNjb3BlLCAkc3RhdGUsIEF1dGhTZXJ2aWNlLCBEaWFsb2dGYWN0b3J5KSA9PiB7XG5cdCRzY29wZS5sb2dpbiA9ICgpID0+IHtcblx0XHRsZXQgY3JlZGVudGlhbHMgPSB7XG5cdFx0XHRlbWFpbDogJHNjb3BlLmVtYWlsLFxuXHRcdFx0cGFzc3dvcmQ6ICRzY29wZS5wYXNzd29yZFxuXHRcdH1cblx0XHRBdXRoU2VydmljZS5sb2dpbihjcmVkZW50aWFscykudGhlbigocmVzKSA9PiB7XG5cdFx0XHQkc3RhdGUuZ28oJ2hvbWUnKTtcblx0XHR9KTtcblx0fVxuXG5cdCRzY29wZS5nZXRVc2VyID0gKCkgPT4ge1xuXHRcdEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4odXNlciA9PiB7XG5cdFx0XHRjb25zb2xlLmxvZygnTG9naW4uanM6IGxvZ2dlZCBpbiB1c2VyJywgdXNlcik7XG5cdFx0XHRcblx0XHR9KVxuXHR9XG59KSIsImFwcC5jb250cm9sbGVyKCdIb21lQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgaG9tZVBob3RvcywgUGhvdG9zRmFjdG9yeSkge1xuICAgICRzY29wZS51cGRhdGVBbGwgPSAoKSA9PiB7XG4gICAgICAgIFBob3Rvc0ZhY3RvcnkudXBkYXRlQWxsKClcbiAgICB9XG5cbiAgICAkc2NvcGUuZ2V0UmFuZG9tID0gKCkgPT4ge1xuICAgIH1cblxuICAgICRzY29wZS5zbGlkZVBob3RvcyA9IGhvbWVQaG90b3M7XG5cblxuICAgICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gICAgICAgJChcIiNvd2wtZGVtb1wiKS5vd2xDYXJvdXNlbCh7XG5cbiAgICAgICAgICAgIGF1dG9QbGF5OiAzMDAwLCAvL1NldCBBdXRvUGxheSB0byAzIHNlY29uZHNcblxuICAgICAgICAgICAgLy8gaXRlbXM6IDEsXG4gICAgICAgICAgICBuYXZpZ2F0aW9uOiB0cnVlLFxuICAgICAgICAgICAgcGFnaW5hdGlvbjogZmFsc2UsXG4gICAgICAgICAgICBzaW5nbGVJdGVtOnRydWVcblxuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG5cbn0pIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnaG9tZScsIHtcbiAgICAgICAgdXJsOiAnLycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnL2pzL2hvbWUvaG9tZS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0hvbWVDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdGhvbWVQaG90b3M6IChQaG90b3NGYWN0b3J5KSA9PiB7XG4gICAgICAgIFx0XHRyZXR1cm4gUGhvdG9zRmFjdG9yeS5nZXRSYW5kb20oMTApXG4gICAgICAgIFx0fVxuICAgICAgICB9XG4gICAgICAgIFxuICAgIH0pO1xufSk7IiwiYXBwLmNvbmZpZygoJHN0YXRlUHJvdmlkZXIpID0+IHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2xheW91dCcsIHtcblx0XHR1cmw6ICcvbGF5b3V0Jyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL2xheW91dC9sYXlvdXQuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ0xheW91dEN0cmwnLFxuXHRcdHJlc29sdmU6IHtcbiAgICAgICAgXHRhbGJ1bXM6IChBbGJ1bUZhY3RvcnksICRzdGF0ZVBhcmFtcykgPT4ge1xuICAgICAgICBcdFx0cmV0dXJuIEFsYnVtRmFjdG9yeS5mZXRjaEFsbCgpXG4gICAgICAgIFx0fVxuICAgICAgICB9XG5cdH0pXG59KTtcblxuXG5hcHAuY29udHJvbGxlcignTGF5b3V0Q3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgUGhvdG9zRmFjdG9yeSwgYWxidW1zKSB7XG5cdGNvbnNvbGUubG9nKFwiYWxsIGFsYnVtc1wiLCBhbGJ1bXMpO1xuXHQkc2NvcGUuYWxidW1zID0gYWxidW1zO1xuXHQkc2NvcGUuZ2V0RmlsZXMgPSAoKSA9PiB7XG5cdFx0Y29uc29sZS5sb2coXCJnZXR0aW5nIEZpbGVzXCIpO1xuXHRcdFBob3Rvc0ZhY3RvcnkuZ2V0RmlsZXMoKTtcblx0fVxufSk7IiwiYXBwLmNvbnRyb2xsZXIoJ1NpZ251cEN0cmwnLCAoJHNjb3BlLCAkcm9vdFNjb3BlLCBVc2VyRmFjdG9yeSkgPT4ge1xuXHQkc2NvcGUudXNlciA9IHt9O1xuXHQkc2NvcGUuc3VibWl0ID0gKCkgPT4ge1xuXHRcdFVzZXJGYWN0b3J5LmNyZWF0ZVVzZXIoJHNjb3BlLnVzZXIpXG5cdFx0LnRoZW4odXNlciA9PiB7XG5cdFx0XHQkcm9vdFNjb3BlLnVzZXIgPSB1c2VyO1xuXHRcdH0pXG5cdH1cbn0pOyIsImFwcC5jb25maWcoKCRzdGF0ZVByb3ZpZGVyKSA9PiB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaWdudXAnLCB7XG5cdFx0dXJsOiAnL3NpZ251cCcsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9zaWdudXAvc2lnbnVwLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdTaWdudXBDdHJsJ1xuXHR9KVxufSk7IiwiYXBwLmNvbnRyb2xsZXIoJ1Bob3RvQ3RybCcsICgkc2NvcGUsICRzdGF0ZSwgUGhvdG9zRmFjdG9yeSwgQWxidW1GYWN0b3J5LCBVc2VyRmFjdG9yeSwgcGhvdG9zKSA9PiB7XG4gICAgbGV0IGFsYnVtQXJyYXkgPSBbXTtcbiAgICAkc2NvcGUudGl0bGUgPSBcIldlbGNvbWVcIjtcbiAgICAkc2NvcGUucGhvdG9zR290ID0gZmFsc2U7XG4gICAgJHNjb3BlLnNlbGVjdGVkUGFnZSA9IDA7XG5cblxuICAgIC8vICRzY29wZS5waG90b3MgPSBzaHVmZmxlKHBob3Rvcyk7XG4gICAgJHNjb3BlLnBob3RvUGFnZXMgPSBzcGxpdEFycmF5KHNodWZmbGUocGhvdG9zKSk7XG5cbiAgICBsZXQgcGhvdG9BcnJheSA9IFtdO1xuXG4gICAgZnVuY3Rpb24gc3BsaXRBcnJheShhcnJheSkge1xuICAgIFx0bGV0IHJldHVybkFycmF5ID0gW11cbiAgICBcdGxldCBjaG9wQXJyYXkgPSBhcnJheTtcbiAgICBcdHdoaWxlKGNob3BBcnJheS5sZW5ndGgpIHtcbiAgICBcdFx0bGV0IG5ld0NodW5rID0gY2hvcEFycmF5LnNwbGljZSgwLCAyMClcbiAgICBcdFx0aWYobmV3Q2h1bmspIHtcbiAgICBcdFx0XHRyZXR1cm5BcnJheS5wdXNoKG5ld0NodW5rKVxuICAgIFx0XHR9XG4gICAgXHR9XG4gICAgXHRyZXR1cm4gcmV0dXJuQXJyYXk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2h1ZmZsZShhcnJheSkge1xuICAgICAgICB2YXIgY3VycmVudEluZGV4ID0gYXJyYXkubGVuZ3RoLFxuICAgICAgICAgICAgdGVtcG9yYXJ5VmFsdWUsIHJhbmRvbUluZGV4O1xuXG4gICAgICAgIHdoaWxlICgwICE9PSBjdXJyZW50SW5kZXgpIHtcblxuICAgICAgICAgICAgcmFuZG9tSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjdXJyZW50SW5kZXgpO1xuICAgICAgICAgICAgY3VycmVudEluZGV4IC09IDE7XG5cbiAgICAgICAgICAgIHRlbXBvcmFyeVZhbHVlID0gYXJyYXlbY3VycmVudEluZGV4XTtcbiAgICAgICAgICAgIGFycmF5W2N1cnJlbnRJbmRleF0gPSBhcnJheVtyYW5kb21JbmRleF07XG4gICAgICAgICAgICBhcnJheVtyYW5kb21JbmRleF0gPSB0ZW1wb3JhcnlWYWx1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXJyYXk7XG4gICAgfVxuXG5cbiAgIFxuXG5cbiAgICAkc2NvcGUuc2V0UGFnZSA9IChpbmRleCkgPT4ge1xuICAgIFx0JHNjb3BlLnNlbGVjdGVkUGFnZSA9IGluZGV4O1xuICAgIH1cblxuICAgICAkc2NvcGUuZm9yd2FyZCA9ICgpID0+IHtcbiAgICAgXHRpZigkc2NvcGUuc2VsZWN0ZWRQYWdlIDwgJHNjb3BlLnBob3RvUGFnZXMubGVuZ3RoKSB7XG4gICAgXHRcdCRzY29wZS5zZWxlY3RlZFBhZ2UrKztcbiAgICAgXHR9XG4gICAgfVxuXG4gICAgJHNjb3BlLmJhY2t3YXJkID0gKCkgPT4ge1xuICAgIFx0aWYoJHNjb3BlLnNlbGVjdGVkUGFnZSA+IDApIHtcbiAgICBcdFx0JHNjb3BlLnNlbGVjdGVkUGFnZS0tO1xuICAgICBcdH1cbiAgICB9XG5cblxuICAgIC8vIGZ1bmN0aW9uIGdhbGxlcnlQaG90b3MgKCl7XG4gICAgLy8gXHRsZXQgYXJyYXkgPSAkc2NvcGUucGhvdG9QYWdlc1swXTtcbiAgICAvLyBcdGxldCBpdGVtcyA9IFtdXG4gICAgLy8gXHRhcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW0pIHtcbiAgICAvLyBcdFx0bGV0IGltZyA9IG5ldyBJbWFnZSgpO1xuICAgIC8vIFx0XHRpbWcuc3JjID0gZWxlbS5zcmM7XG4gICAgLy8gXHRcdGNvbnNvbGUubG9nKGltZy53aWR0aCk7XG4gICAgLy8gXHRcdGxldCBuZXdJbWcgPSB7XG4gICAgLy8gXHRcdFx0c3JjOiBlbGVtLnNyYyxcbiAgICAvLyBcdFx0XHR3OiAxMjAwLFxuICAgIC8vIFx0XHRcdGg6IDgwMFxuICAgIC8vIFx0XHR9XG4gICAgLy8gXHRcdGl0ZW1zLnB1c2gobmV3SW1nKTtcbiAgICAvLyBcdH0pXG4gICAgLy8gXHRjb25zb2xlLmxvZyhpdGVtcyk7XG4gICAgLy8gXHQkc2NvcGUuZ2FsbGVyeVBob3RvcyA9IGl0ZW1zO1xuICAgIC8vIH1cblxuICAgICRzY29wZS5vcGVuR2FsbGVyeSA9IChpbmRleCkgPT4ge1xuICAgXHRcdCRzY29wZS5zaG93R2FsbGVyeSA9IHRydWU7XG4gICBcdFx0bGV0IHNsaWRlSW5kZXggPSBpbmRleFxuICAgIFx0JHNjb3BlLnNsaWRlSW5kZXggPSBpbmRleDtcbiAgICBcdGNvbnNvbGUubG9nKGluZGV4KTtcbiAgICBcdCRzY29wZS5hY3RpdmUgPSBpbmRleDtcbiAgICBcdGxldCBpbWdBcnJheSA9ICRzY29wZS5waG90b1BhZ2VzWyRzY29wZS5zZWxlY3RlZFBhZ2VdXG4gICBcdCBcdGltZ0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbSwgaW5kZXgpIHtcbiAgIFx0IFx0XHRlbGVtLmlkID0gaW5kZXg7XG4gICBcdCBcdFx0aWYoaW5kZXggPT09IHNsaWRlSW5kZXgpIHtcbiAgIFx0IFx0XHRcdGVsZW0uYWN0aXZlID0gdHJ1ZTtcbiAgIFx0IFx0XHRcdGNvbnNvbGUubG9nKFwiYWN0aXZlOlwiLCBlbGVtKTtcbiAgIFx0IFx0XHR9XG4gICBcdCBcdH0pXG4gICAgICAgJHNjb3BlLmdhbGxlcnlQaG90b3MgPSBpbWdBcnJheTtcbiAgICB9XG5cbiAgICAkc2NvcGUuc2hvdyA9IChwaG90bykgPT4ge1xuICAgXHQgXHQvLyBnYWxsZXJ5UGhvdG9zKCk7XG4gICBcdCBcdFxuXG4gICAgfVxuXG5cblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncGhvdG9zJywge1xuICAgICAgICB1cmw6ICcvcGhvdG9zJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9waG90b3MvcGhvdG9zLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnUGhvdG9DdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICAgICAgcGhvdG9zOiAoUGhvdG9zRmFjdG9yeSwgJHN0YXRlUGFyYW1zKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFBob3Rvc0ZhY3RvcnkuZmV0Y2hBbGwoKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuXG5cblxuXG4iLCJhcHAuY29udHJvbGxlcignVXBsb2FkQ3RybCcsICgkc2NvcGUsICRzdGF0ZSwgYWxidW1zLCBQaG90b3NGYWN0b3J5LCBBbGJ1bUZhY3RvcnksIEZpbGVVcGxvYWRlcikgPT4ge1xuXG4gICAgbGV0IGFsYnVtQ3JlYXRlZCA9IGZhbHNlO1xuICAgIGxldCBhZGRUb0FsYnVtO1xuXG5cbiAgICAkc2NvcGUuc2VsZWN0ZWRBbGJ1bSA9IG51bGw7XG5cbiAgICAkc2NvcGUudXBsb2FkQWxidW0gPSBcIm5vbmVcIjtcblxuICAgICRzY29wZS51cGxvYWRVcmwgPSBcIi9hcGkvdXBsb2FkL3Bob3RvL1wiXG5cbiAgICAkc2NvcGUuY3JlYXRpbmdBbGJ1bSA9IGZhbHNlO1xuXG5cbiAgICAkc2NvcGUuc2V0QWxidW0gPSAoYWxidW0pID0+IHtcbiAgICAgICAgJHNjb3BlLnNlbGVjdGVkQWxidW0gPSBhbGJ1bTtcbiAgICAgICAgJHNjb3BlLnVwbG9hZEFsYnVtID0gYWxidW0uX2lkO1xuICAgICAgICBjb25zb2xlLmxvZygkc2NvcGUuc2VsZWN0ZWRBbGJ1bSk7XG4gICAgfVxuICAgICRzY29wZS5uZXdBbGJ1bSA9IGZhbHNlO1xuICAgICRzY29wZS5waG90b0FsYnVtID0gbnVsbDtcbiAgICAkc2NvcGUuYWxidW1zID0gYWxidW1zO1xuICAgICRzY29wZS5jcmVhdGVBbGJ1bSA9ICgpID0+IHtcbiAgICAgICAgbGV0IGFsYnVtID0ge1xuICAgICAgICAgICAgdGl0bGU6ICRzY29wZS5hbGJ1bVRpdGxlXG4gICAgICAgIH1cbiAgICAgICAgaWYoJHNjb3BlLnByaXZhdGUpIHtcbiAgICAgICAgICAgIGFsYnVtLnByaXZhdGUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIEFsYnVtRmFjdG9yeS5jcmVhdGVBbGJ1bShhbGJ1bSkudGhlbihhbGJ1bSA9PiB7XG4gICAgICAgICAgICAkc2NvcGUuYWxidW1zLnB1c2goYWxidW0pO1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkQWxidW0gPSBhbGJ1bTtcbiAgICAgICAgICAgICRzY29wZS51cGxvYWRBbGJ1bSA9IGFsYnVtLl9pZDtcbiAgICAgICAgICAgICRzY29wZS5jcmVhdGluZ0FsYnVtID0gZmFsc2U7XG4gICAgICAgIH0pXG4gICAgfVxuICAgICRzY29wZS5jaGVja0FsYnVtID0gKCkgPT4ge1xuICAgICAgICBpZiAoYWxidW1DcmVhdGVkKSB7XG4gICAgICAgICAgICBhZGRUb0FsYnVtID0gYWxidW1DcmVhdGVkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWRkVG9BbGJ1bSA9ICRzY29wZS5waG90b0FsYnVtXG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCd1cGxvYWQnLCB7XG4gICAgICAgIHVybDogJy91cGxvYWQnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3VwbG9hZC91cGxvYWQuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdVcGxvYWRDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdGFsYnVtczogKEFsYnVtRmFjdG9yeSkgPT4ge1xuICAgICAgICBcdFx0cmV0dXJuIEFsYnVtRmFjdG9yeS5mZXRjaEFsbCgpLnRoZW4oYWxidW1zID0+IHtcbiAgICAgICAgXHRcdFx0cmV0dXJuIGFsYnVtcztcbiAgICAgICAgXHRcdH0pXG4gICAgICAgIFx0fVxuICAgICAgICB9XG4gICAgfSk7XG59KTsiLCJhcHAuZmFjdG9yeSgnQWxidW1GYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHRpbWVvdXQsIERpYWxvZ0ZhY3RvcnkpIHtcbiAgICBsZXQgc3VjY2VzcyA9ICh0ZXh0KSA9PiB7XG4gICAgICAgIERpYWxvZ0ZhY3RvcnkuZGlzcGxheSh0ZXh0LCA3NTApO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBjcmVhdGVBbGJ1bTogKGFsYnVtKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9hbGJ1bXMvJywgYWxidW0pLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzKFwiY3JlYXRlZFwiKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInJlc1wiLCByZXMpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcImVycm9yIHNhdmluZyBhbGJ1bVwiLCBlKTtcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgfSxcbiAgICAgICAgZmV0Y2hBbGw6ICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvYWxidW1zLycpXG4gICAgICAgICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICAgIHVwZGF0ZUFsYnVtOiAoYWxidW0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL2FsYnVtcy91cGRhdGUnLCBhbGJ1bSlcbiAgICAgICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgICAgZmV0Y2hPbmU6IChhbGJ1bUlkKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL2FsYnVtcy8nKyBhbGJ1bUlkKVxuICAgICAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLmRhdGFcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBmaW5kVXNlckFsYnVtczogKHVzZXJJZCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9hbGJ1bXMvdXNlci8nICsgdXNlcklkKS50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgICAgYWRkUGhvdG86IChhbGJ1bUlkLCBwaG90b0lkKSA9PiB7XG4gICAgICAgICAgICBsZXQgb2JqID0ge307XG4gICAgICAgICAgICBvYmouYWxidW1JZCA9IGFsYnVtSWQ7XG4gICAgICAgICAgICBvYmoucGhvdG9JZCA9IHBob3RvSWQ7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9hbGJ1bXMvYWRkUGhvdG8nLCBvYmopXG4gICAgICAgICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXMuZGF0YVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGRlbGV0ZUFsYnVtOiAoYWxidW1JZCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmRlbGV0ZSgnL2FwaS9hbGJ1bXMvJysgYWxidW1JZClcbiAgICAgICAgfSwgXG4gICAgICAgIGZldGNoUGhvdG9zSW5BbGJ1bTogKGFsYnVtSWQpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvYWxidW1zL3Bob3Rvcy8nICsgYWxidW1JZCkudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicmVzXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXMuZGF0YVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbn0pIiwiYXBwLmZhY3RvcnkoJ1Bob3Rvc0ZhY3RvcnknLCAoJGh0dHApID0+IHtcblx0cmV0dXJuIHtcblx0XHRhZGRQaG90bzogKHNyYykgPT4ge1xuXHRcdFx0bGV0IHBob3RvID0ge1xuXHRcdFx0XHRzcmM6IHNyYyxcblx0XHRcdFx0bmFtZTogJ3Rlc3QnXG5cdFx0XHR9XG5cdFx0XHQkaHR0cC5wb3N0KCcvYXBpL3Bob3Rvcy9hZGQnLCBwaG90bylcblx0XHRcdC50aGVuKHJlcyA9PiB7XG5cdFx0XHR9KVxuXHRcdH0sXG5cdFx0c2F2ZVBob3RvOiAocGhvdG8pID0+IHtcblx0XHRcdCRodHRwLnBvc3QoJy9hcGkvcGhvdG9zL3VwZGF0ZScsIHBob3RvKS50aGVuKHJlcyA9PiB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKHJlcy5kYXRhKTtcblx0XHRcdH0pXG5cdFx0fSxcblx0XHRmZXRjaEFsbDogKCkgPT4ge1xuXHRcdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS9waG90b3MnKVxuXHRcdFx0LnRoZW4ocmVzID0+IHtcblx0XHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xuXHRcdFx0fSlcblx0XHR9LFxuXHRcdGZldGNoVGVuOiAoKSA9PiB7XG5cdFx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3Bob3Rvcy9saW1pdDEwJylcblx0XHRcdC50aGVuKHJlcyA9PiB7XG5cdFx0XHRcdHJldHVybiByZXMuZGF0YTtcblx0XHRcdH0pXG5cdFx0fSxcblx0XHRnZXRGaWxlczogKCkgPT4ge1xuXHRcdFx0JGh0dHAuZ2V0KCcvYXBpL2dldEZpbGVzL2FsYnVtQScpXG5cdFx0XHQudGhlbihyZXMgPT4ge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcIlJldHVybmVkOiBcIiwgcmVzLmRhdGEpO1xuXHRcdFx0fSlcblx0XHR9LFxuXHRcdHVwZGF0ZUFsbDogKCkgPT4ge1xuXHRcdFx0JGh0dHAucHV0KCcvYXBpL3Bob3Rvcy91cGRhdGVBbGwnKS50aGVuKHJlcyA9PiB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwicmVzOiBcIiwgcmVzLmRhdGEpO1xuXHRcdFx0fSlcblx0XHR9LFxuXHRcdGdldFJhbmRvbTogKGFtb3VudCkgPT4ge1xuXHRcdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS9waG90b3MvcmFuZG9tLycgKyBhbW91bnQpLnRoZW4ocmVzID0+IHtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJyZXM6IFwiLCByZXMuZGF0YSk7XG5cdFx0XHRcdHJldHVybiByZXMuZGF0YTtcblx0XHRcdH0pXG5cdFx0fVxuXHR9XG59KTsiLCJhcHAuZmFjdG9yeSgnVXNlckZhY3RvcnknLCAoJGh0dHAsICRyb290U2NvcGUsIERpYWxvZ0ZhY3RvcnkpID0+IHtcblx0cmV0dXJuIHtcblx0XHRjdXJyZW50VXNlcjogKCkgPT4ge1xuXHRcdFx0bGV0IHVzZXIgPSB7XG5cdFx0XHRcdG5hbWU6ICdEYW5lJyxcblx0XHRcdFx0cGljdHVyZTogJ1NvbWV0aGluZycsXG5cdFx0XHRcdGFsYnVtczogWydPbmUnLCAnVHdvJywgJ1RocmVlJ11cblx0XHRcdH1cblx0XHRcdHJldHVybiB1c2VyXG5cdFx0XHQvL3NlbmQgcmVxdWVzdCBmb3IgY3VycmVudCBsb2dnZWQtaW4gdXNlclxuXHRcdH0sXG5cdFx0Y3JlYXRlVXNlcjogKHVzZXIpID0+IHtcblx0XHRcdHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3VzZXJzLycsIHVzZXIpLnRoZW4ocmVzID0+IHtcblx0XHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xuXHRcdFx0fSlcblx0XHR9LFxuXHRcdGdldFVzZXI6ICgpID0+IHtcblx0XHRcdGxldCB1c2VybmFtZSA9ICdkYW5ldG9tc2V0aCc7XG5cdFx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3VzZXJzLycrIHVzZXJuYW1lKS50aGVuKHJlcyA9PiB7XG5cdFx0XHRcdCRyb290U2NvcGUudXNlciA9IHJlcy5kYXRhXG5cdFx0XHRcdHJldHVybiByZXMuZGF0YTtcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRmb2xsb3dBbGJ1bTogKGFsYnVtKSA9PiB7XG5cdFx0XHRsZXQgdXNlciA9ICRyb290U2NvcGUudXNlclxuXHRcdFx0aWYodXNlci5hbGJ1bXMuaW5kZXhPZigpICE9PSAtMSkge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnYWxidW0gYWxyZWFkeSBleGlzdHMnKTtcblx0XHRcdH1cblx0XHRcdHVzZXIuYWxidW1zLnB1c2goYWxidW0pO1xuXG5cdFx0XHQkaHR0cC5wb3N0KCcvYXBpL3VzZXJzL3VwZGF0ZScsIHVzZXIpLnRoZW4ocmVzID0+IHtcblx0XHRcdFx0aWYocmVzLnN0YXR1cyA9PT0gMjAwKSB7XG5cdFx0XHRcdFx0RGlhbG9nRmFjdG9yeS5kaXNwbGF5KCdBZGRlZCBUbyBBbGJ1bXMnLCAxMDAwKVxuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdERpYWxvZ0ZhY3RvcnkuZGlzcGxheSgnU3RhdHVzIG5vdCAyMDAnLCAxMDAwKVxuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdH0sXG5cdFx0Zm9sbG93UGhvdG86IChwaG90bykgPT4ge1xuXHRcdFx0bGV0IHVzZXIgPSAkcm9vdFNjb3BlLnVzZXJcblx0XHRcdGlmKHVzZXIucGhvdG9zLmluZGV4T2YoKSAhPT0gLTEpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ1Bob3RvIGFscmVhZHkgZXhpc3RzJyk7XG5cdFx0XHR9XG5cdFx0XHR1c2VyLnBob3Rvcy5wdXNoKHBob3RvKTtcblxuXHRcdFx0JGh0dHAucG9zdCgnL2FwaS91c2Vycy91cGRhdGUnLCB1c2VyKS50aGVuKHJlcyA9PiB7XG5cdFx0XHRcdGlmKHJlcy5zdGF0dXMgPT09IDIwMCkge1xuXHRcdFx0XHRcdERpYWxvZ0ZhY3RvcnkuZGlzcGxheSgnQWRkZWQgVG8gUGhvdG9zJywgMTAwMClcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHREaWFsb2dGYWN0b3J5LmRpc3BsYXkoJ1N0YXR1cyBub3QgMjAwJywgMTAwMClcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHR9XG5cdH1cbn0pOyIsImFwcC5mYWN0b3J5KCdEaWFsb2dGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsICRtZERpYWxvZywgJHRpbWVvdXQpIHsgXG5cdFxuXG5cdGxldCBzaG93RGlhbG9nID0gKG1lc3NhZ2UpID0+IHtcblx0XHR2YXIgcGFyZW50RWwgPSBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQuYm9keSk7XG4gICAgICAgJG1kRGlhbG9nLnNob3coe1xuICAgICAgICAgcGFyZW50OiBwYXJlbnRFbCxcbiAgICAgICAgIHRlbXBsYXRlOlxuICAgICAgICAgICAnPG1kLWRpYWxvZyBhcmlhLWxhYmVsPVwiTGlzdCBkaWFsb2dcIiBpZD1cImRpYWxvZ1wiPicgK1xuICAgICAgICAgICAnICA8bWQtZGlhbG9nLWNvbnRlbnQ+JytcbiAgICAgICAgICAgXHRtZXNzYWdlICtcbiAgICAgICAgICAgJyAgPC9tZC1kaWFsb2ctY29udGVudD4nICtcbiAgICAgICAgICAgJzwvbWQtZGlhbG9nPidcbiAgICAgIH0pO1xuXHR9XG5cblxuXHRyZXR1cm4ge1xuXHRcdGRpc3BsYXk6IChtZXNzYWdlLCB0aW1lb3V0KSA9PiB7XG5cdFx0XHRzaG93RGlhbG9nKG1lc3NhZ2UpO1xuXHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCRtZERpYWxvZy5oaWRlKCk7XG5cdFx0XHR9LCB0aW1lb3V0KVxuXHRcdH1cblx0fVxuXG5cblxufSk7IiwiYXBwLmRpcmVjdGl2ZSgnenRTaXplJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHIpIHtcbiAgICAgICAgICAgIGxldCBzaXplID0gYXR0ci56dFNpemUuc3BsaXQoJ3gnKTtcblxuICAgICAgICAgICAgaWYgKGF0dHIuYWJzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNpemVbMF0ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiBzaXplWzBdICsgJ3B4J1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoc2l6ZVsxXS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5jc3Moe1xuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBzaXplWzFdICsgJ3B4J1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChzaXplWzBdLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAnbWluLXdpZHRoJzogc2l6ZVswXSArICdweCdcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHNpemVbMV0ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdtaW4taGVpZ2h0Jzogc2l6ZVsxXSArICdweCdcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgfVxuICAgIH1cbn0pOyIsImFwcC5kaXJlY3RpdmUoJ2FsYnVtQ2FyZCcsICgkcm9vdFNjb3BlLCAkc3RhdGUpID0+IHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdGNvbnRyb2xsZXI6ICdBbGJ1bXNDdHJsJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2FsYnVtcy9hbGJ1bS1jYXJkLmh0bWwnLFxuXHRcdGxpbms6IChzY29wZSkgPT4ge1xuXHRcdFx0c2NvcGUuZWRpdEFsYnVtID0gKCkgPT4ge1xuXHRcdFx0XHQkc3RhdGUuZ28oJ2VkaXRBbGJ1bScsIHthbGJ1bUlkOiBzY29wZS5hbGJ1bS5faWR9KTtcblx0XHRcdH1cblxuXHRcdFx0c2NvcGUudmlld0FsYnVtID0gKCkgPT4ge1xuXHRcdFx0XHQkc3RhdGUuZ28oJ3NpbmdsZUFsYnVtJywge2FsYnVtSWQ6IHNjb3BlLmFsYnVtLl9pZH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRzY29wZS5hZGRUb0Zhdm9yaXRlcyA9ICgpID0+IHtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJjYWxsIHVzZXIgaGVyZVwiKTtcblx0XHRcdH1cblx0fVxufVxufSk7IiwiYXBwLmRpcmVjdGl2ZSgnc2VsZWN0QWxidW0nLCAoJHJvb3RTY29wZSkgPT4ge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0Y29udHJvbGxlcjogJ0FsYnVtc0N0cmwnLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvYWxidW1zL2FsYnVtLmh0bWwnLFxuXHRcdGxpbms6IChzY29wZSkgPT4ge1xuXG5cdH1cbn1cbn0pOyIsImFwcC5kaXJlY3RpdmUoJ3VzZXJBbGJ1bXMnLCAoJHJvb3RTY29wZSwgJHN0YXRlKSA9PiB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdFJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2FsYnVtcy91c2VyLWFsYnVtcy5odG1sJyxcblx0XHRsaW5rOiAoc2NvcGUpID0+IHtcblx0XHRcdHNjb3BlLmVkaXRBbGJ1bSA9ICgpID0+IHtcblx0XHRcdFx0JHN0YXRlLmdvKCdlZGl0QWxidW0nLCB7YWxidW1JZDogc2NvcGUuYWxidW0uX2lkfSk7XG5cdFx0XHR9XG5cblx0XHRcdHNjb3BlLmFkZFRvRmF2b3JpdGVzID0gKCkgPT4ge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcImNhbGwgdXNlciBoZXJlXCIpO1xuXHRcdFx0fVxuXHR9XG59XG59KTsiLCJhcHAuZGlyZWN0aXZlKCdiYW5uZXInLCAoJHJvb3RTY29wZSwgJHN0YXRlLCBTZXNzaW9uLCBVc2VyRmFjdG9yeSwgQWxidW1GYWN0b3J5LCBBdXRoU2VydmljZSkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvYmFubmVyL2Jhbm5lci5odG1sJyxcbiAgICAgICAgbGluazogKHNjb3BlKSA9PiB7XG4gICAgICAgICAgICAvLyBVc2VyRmFjdG9yeS5nZXRVc2VyKCkudGhlbih1c2VyID0+IHtcbiAgICAgICAgICAgIC8vICAgICBzY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgIC8vICAgICByZXR1cm4gQWxidW1GYWN0b3J5LmZpbmRVc2VyQWxidW1zKHVzZXIuX2lkKVxuICAgICAgICAgICAgLy8gfSkudGhlbihhbGJ1bXMgPT4ge1xuICAgICAgICAgICAgLy8gICAgIHNjb3BlLnVzZXIuYWxidW1zLnB1c2goYWxidW1zKTtcbiAgICAgICAgICAgIC8vICAgICBjb25zb2xlLmxvZyhzY29wZS51c2VyLmFsYnVtcyk7XG4gICAgICAgICAgICAvLyB9KVxuXG4gICAgICAgICAgICBVc2VyRmFjdG9yeS5nZXRVc2VyKCkudGhlbih1c2VyID0+IHtcbiAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhzY29wZS51c2VyKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBBbGJ1bUZhY3RvcnkuZmluZFVzZXJBbGJ1bXModXNlci5faWQpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oYWxidW1zID0+IHtcbiAgICAgICAgICAgICAgICBzY29wZS51c2VyQWxidW1zID0gYWxidW1zO1xuICAgICAgICAgICAgICAgIGlmKHNjb3BlLnVzZXIuYWxidW1zLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyQWxidW1zLnB1c2goc2NvcGUudXNlci5hbGJ1bXMpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHNjb3BlLnVzZXJBbGJ1bXMpO1xuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgLy8gQWxidW1GYWN0b3J5LmZpbmRVc2VyQWxidW1zKFNlc3Npb24udXNlci5faWQpXG4gICAgICAgICAgICAvLyAudGhlbihhbGJ1bXMgPT4ge1xuICAgICAgICAgICAgLy8gICAgIHNjb3BlLnVzZXJBbGJ1bXMgPSBhbGJ1bXM7XG4gICAgICAgICAgICAvLyAgICAgY29uc29sZS5sb2coc2NvcGUudXNlckFsYnVtcyk7XG4gICAgICAgICAgICAvLyB9KVxuXG4gICAgICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKHVzZXIgPT4ge1xuICAgICAgICAgICAgICAgIGlmKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IHVzZXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3Q6ICdHdWVzdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0OiAnJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHNjb3BlLnNob3dBbGJ1bXMgPSBmYWxzZTtcbiAgICAgICAgICAgIHNjb3BlLnNob3dQaWN0dXJlcyA9IGZhbHNlO1xuXG4gICAgICAgICAgICBzY29wZS5hZGRBbGJ1bXMgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgc2NvcGUuc2hvd0FsYnVtcyA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNjb3BlLmFkZFBpY3R1cmVzID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHNjb3BlLnNob3dQaWN0dXJlcyA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNjb3BlLnZpZXdBbGJ1bSA9IChhbGJ1bSkgPT4ge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnc2luZ2xlQWxidW0nLCB7XG4gICAgICAgICAgICAgICAgICAgIGFsYnVtSWQ6IGFsYnVtLl9pZFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgIH1cbn0pOyIsImFwcC5kaXJlY3RpdmUoJ2Zvb3RlckVsZW0nLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0FFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9mb290ZXIvZm9vdGVyLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgfVxuICAgIH07XG59KTsiLCJhcHAuZGlyZWN0aXZlKCdwaG90b0dhbGxlcnknLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0FFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9nYWxsZXJ5L2dhbGxlcnkuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXG4gICAgICAgICAgICBzY29wZS5zdGFydEdhbGxlcnkgPSAoaXRlbSkgPT4ge1xuICAgICAgICAgICAgXHRjb25zb2xlLmxvZyhpdGVtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59KTsiLCJhcHAuZGlyZWN0aXZlKCdpbWdMb2FkaW5nJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdBRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvbG9hZGVyL2ltZ2xvYWRpbmcuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICB9XG4gICAgfTtcbn0pOyIsImFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCBBVVRIX0VWRU5UUywgJHN0YXRlKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge30sXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUpIHtcblxuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLmN1cnJlbnRQYWdlID0gdG9TdGF0ZS5uYW1lO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIClcblxuICAgICAgICAgICAgc2NvcGUuaXRlbXMgPSBbe1xuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0hvbWUnLFxuICAgICAgICAgICAgICAgICAgICBzdGF0ZTogJ2hvbWUnXG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ1Bob3RvcycsXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlOiAncGhvdG9zJ1xuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdBbGJ1bXMnLFxuICAgICAgICAgICAgICAgICAgICBzdGF0ZTogJ2FsYnVtcydcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnVXBsb2FkJyxcbiAgICAgICAgICAgICAgICAgICAgc3RhdGU6ICd1cGxvYWQnXG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ05ldyBBbGJ1bScsXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlOiAnbmV3QWxidW0nXG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdBZG1pbicsXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlOiAnYWRtaW4nXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG5cbiAgICAgICAgICAgIHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzY29wZS5sb2dvdXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5sb2dvdXQoKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cblxuXG4gICAgICAgICAgICB2YXIgc2V0VXNlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24odXNlcikge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciByZW1vdmVVc2VyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzZXRVc2VyKCk7XG5cbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcywgc2V0VXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzLCByZW1vdmVVc2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCByZW1vdmVVc2VyKTtcblxuICAgICAgICB9XG5cbiAgICB9O1xuXG59KTsiLCJhcHAuZGlyZWN0aXZlKCdpbWFnZW9ubG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3NzKHtcbiAgICAgICAgICAgICAgICBkaXNwbGF5OiAnbm9uZSdcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIGVsZW1lbnQuYmluZCgnZXJyb3InLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBhbGVydCgnaW1hZ2UgY291bGQgbm90IGJlIGxvYWRlZCcpO1xuICAgICAgICAgICAgfSk7XG5cblxuICAgICAgICAgICAgZWxlbWVudC5vbignbG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUucGhvdG8udmlzaWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5jc3Moe1xuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnYmxvY2snXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgICAgIC8vIHNjb3BlLnBob3RvLnZpc2libGUgPSB0cnVlO1xuXG4gICAgICAgICAgICBzY29wZS5pbWFnZUxvYWRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9O1xufSk7IiwiYXBwLmRpcmVjdGl2ZSgncGhvdG9FZGl0JywgKFBob3Rvc0ZhY3RvcnkpID0+IHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvcGhvdG8vcGhvdG8tZWRpdC5odG1sJyxcblx0XHRsaW5rOiAoc2NvcGUsIGVsZW0sIGF0dHIpID0+IHtcblx0XHRcdHNjb3BlLnNhdmVQaG90byA9ICgpID0+IHtcblx0XHRcdFx0UGhvdG9zRmFjdG9yeS5zYXZlUGhvdG8oc2NvcGUucGhvdG8pXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59KTsiLCJhcHAuZGlyZWN0aXZlKCdzaW5nbGVQaG90bycsICgkcm9vdFNjb3BlLCAkc3RhdGUpID0+IHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdHNjb3BlOiB7XG5cdFx0XHRwaG90bzogJz0nXG5cdFx0fSxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL3Bob3RvL3NpbmdsZS1waG90by5odG1sJyxcblx0XHRsaW5rOiAoc2NvcGUpID0+IHtcblx0XHRcdHNjb3BlLnZpZXdQaG90byA9ICgpID0+IHtcblx0XHRcdFx0Y29uc29sZS5sb2coc2NvcGUucGhvdG8pO1xuXHRcdFx0fVxuXG5cdFx0XHRcblx0fVxufVxufSk7IiwiYXBwLmRpcmVjdGl2ZSgndXBsb2FkZXInLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL3VwbG9hZC91cGxvYWQuaHRtbCcsXG4gICAgICAgIGxpbms6IChzY29wZSwgZWxlbSwgYXR0cikgPT4ge1xuICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBnYWxsZXJ5VXBsb2FkZXIgPSBuZXcgcXEuRmluZVVwbG9hZGVyKHtcbiAgICAgICAgICAgICAgICBlbGVtZW50OiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbmUtdXBsb2FkZXItZ2FsbGVyeVwiKSxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogJ3FxLXRlbXBsYXRlLWdhbGxlcnknLFxuICAgICAgICAgICAgICAgIHJlcXVlc3Q6IHtcbiAgICAgICAgICAgICAgICAgICAgZW5kcG9pbnQ6ICcvYXBpL3VwbG9hZC9waG90by8nKyBzY29wZS51cGxvYWRBbGJ1bVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdGh1bWJuYWlsczoge1xuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcnM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhaXRpbmdQYXRoOiAnL2Fzc2V0cy9wbGFjZWhvbGRlcnMvd2FpdGluZy1nZW5lcmljLnBuZycsXG4gICAgICAgICAgICAgICAgICAgICAgICBub3RBdmFpbGFibGVQYXRoOiAnL2Fzc2V0cy9wbGFjZWhvbGRlcnMvbm90X2F2YWlsYWJsZS1nZW5lcmljLnBuZydcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICBhbGxvd2VkRXh0ZW5zaW9uczogWydqcGVnJywgJ2pwZycsICdnaWYnLCAncG5nJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuXG4gICAgICAgICAgICBsZXQgdXBkYXRlRW5kcG9pbnQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGVuZHBvaW50ID0gJy9hcGkvdXBsb2FkL3Bob3RvLycgKyBzY29wZS51cGxvYWRBbGJ1bTtcbiAgICAgICAgICAgICAgICBnYWxsZXJ5VXBsb2FkZXIuc2V0RW5kcG9pbnQoZW5kcG9pbnQpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZW5kcG9pbnQgdXBkYXRlZFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNjb3BlLiR3YXRjaCgndXBsb2FkQWxidW0nLCAobmV3VmFsLCBvbGRWYWwpID0+IHtcbiAgICAgICAgICAgICAgICB1cGRhdGVFbmRwb2ludCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgIH1cbn0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
