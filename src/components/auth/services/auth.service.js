(function (angular) {
    'use strict';

    angular.module('znk.infra.auth').factory('AuthService',
    function (ENV, $q, $timeout, $log, StorageFirebaseAdapter, StorageSrv, $http, $rootScope) {
        'ngInject';

            if (ENV.fbGlobalEndPoint && ENV.fbDataEndPoint){
                var refAuthDB = initializeAuthFireBase();
                var rootRef = initializeDataFireBase();

                refAuthDB = refAuthDB.auth();
            }

            var authService = {};

            authService.saveRegistration = function (registration, login) {
                var registerInProgress = true;
                var dfd = $q.defer();
                authService.logout(true);

                var timeoutPromise = $timeout(function () {
                    if (registerInProgress) {
                        dfd.reject('timeout');
                    }
                }, ENV.promiseTimeOut);

                registration.profile = {};

                refAuthDB.createUserWithEmailAndPassword(registration.email, registration.password).then(function () {
                    registerInProgress = false;
                    $timeout.cancel(timeoutPromise);

                    if (login) {
                        authService.login({
                            email: registration.email,
                            password: registration.password
                        }).then(function (loginData) {
                            authService.registerFirstLogin();
                            dfd.resolve(loginData);
                        }, function (err) {
                            dfd.reject(err);
                        });
                    } else {
                        dfd.resolve();
                    }
                }, function (error) {
                    $timeout.cancel(timeoutPromise);
                    dfd.reject(error);
                });
                return dfd.promise;
            };

            authService.login = function (loginData) {
                var deferred = $q.defer();

                refAuthDB.signOut();

                refAuthDB.signInWithEmailAndPassword(loginData.email, loginData.password).then(function (authData) {
                    $log.debug('authSrv::login(): uid=' + authData.uid);
                    _onAuth(authData).then(function () {
                        deferred.resolve(authData);
                    });
                }).catch(function (err) {
                    authService.logout();
                    deferred.reject(err);
                });

                return deferred.promise;
            };

            authService.logout = function () {
                refAuthDB.signOut();
                rootRef.auth().signOut();
            };

            authService.forgotPassword = function (forgotPasswordData) {
                return refAuthDB.sendPasswordResetEmail(forgotPasswordData.email);
            };

            authService.getAuth = function() {
                return new Promise(function(resolve, reject) {
                    refAuthDB.onAuthStateChanged(user => {
                        if (user) {
                            resolve(user); }
                        else {
                            resolve (null);
                        }
                    }, err => reject(err));
                });
            };

            authService.changePassword = function () {
                return refAuthDB.sendPasswordResetEmail(refAuthDB.currentUser().email );
            };

            authService.createAuthWithCustomToken = function (refDB, token) {
                var deferred = $q.defer();
                refDB.auth().signInWithCustomToken(token, function (error, userData) {
                    if (error) {
                        deferred.reject(error);
                    }
                    $log.debug('createAuthWithCustomToken: uid=' + userData.uid);
                    deferred.resolve(userData);
                });
                return deferred.promise;
            };

            authService.userDataForAuthAndDataFb = function (data) {
                var proms = [
                    authService.createAuthWithCustomToken(refAuthDB, data.authToken),
                    authService.createAuthWithCustomToken(rootRef, data.dataToken)
                ];
                return $q.all(proms);
            };

            authService.registerFirstLogin = function () {
                var storageSrv = storageObj();
                return authService.getAuth().then(user => {
                    var firstLoginPath = 'firstLogin/' + user.uid;
                    return storageSrv.get(firstLoginPath).then(function (userFirstLoginTime) {
                        if (angular.equals(userFirstLoginTime, {})) {
                            storageSrv.set(firstLoginPath, Date.now());
                        }
                    });
                });
            };

            function storageObj() {
                var fbAdapter = new StorageFirebaseAdapter(ENV.fbDataEndPoint + '/' + ENV.firebaseAppScopeName);
                var config = {
                    variables: {
                        uid: function () {
                            return authService.getAuth().then(user => {
                                return user.uid;
                            });
                        }
                    }
                };
                return new StorageSrv(fbAdapter, config);
            }

            function _dataLogin() {
                var postUrl = ENV.backendEndpoint + 'firebase/token';
                //TODO - CHECK IT (ASSAF)
                var authData = refAuthDB.currentUser();
                var postData = {
                    email: authData.password,
                    uid: authData.uid,
                    fbDataEndPoint: ENV.fbDataEndPoint,
                    fbEndpoint: ENV.fbGlobalEndPoint,
                    auth: ENV.dataAuthSecret,
                    token: authData.refreshToken
                };

                return $http.post(postUrl, postData).then(function (token) {
                    var defer = $q.defer();
                    rootRef.authWithCustomToken(token.data, function (error, userAuthData) {
                        if (error) {
                            defer.reject(error);
                        }
                        $log.debug('authSrv::login(): uid=' + userAuthData.uid);
                        defer.resolve(userAuthData);
                    });
                    return defer.promise;
                });
            }

            function _onAuth(data) {
                var _loginAuthData = data;

                if (_loginAuthData) {
                    return _dataLogin(_loginAuthData).then(function () {
                        $rootScope.$broadcast('auth:login', _loginAuthData);
                    });
                }
                $rootScope.$broadcast('auth:logout');
                return $q.when();
            }

            function initializeDataFireBase(){
                var existApp = existFirbaseApp(ENV.firebaseAppScopeName);
                if(!existApp) {
                    var config = {
                        apiKey: ENV.firebase_apiKey,
                        authDomain:  ENV.firebase_projectId + ".firebaseapp.com",
                        databaseURL: ENV.fbDataEndPoint,
                        projectId: ENV.firebase_projectId,
                        storageBucket: ENV.firebase_projectId + ".appspot.com",
                        messagingSenderId: ENV.messagingSenderId
                    };
                    existApp = window.firebase.initializeApp(config, ENV.firebaseAppScopeName);
                }
                return existApp;
            }

            function initializeAuthFireBase(){
                var existApp = existFirbaseApp(ENV.authAppName);
                if(!existApp) {
                    existApp = window.firebase.initializeApp(ENV.firbase_auth_config, ENV.authAppName);
                }
              return existApp;
            }

            function existFirbaseApp(appName) {
                var existApp;

                window.firebase.apps.forEach(function (app) {
                    if (app.name.toLowerCase() === appName.toLowerCase()) {
                        existApp = app;
                    }
                });
                return existApp;
            }

            return authService;
        });
})(angular);
