(function (angular) {
    'use strict';

    angular.module('znk.infra.auth', [
        'pascalprecht.translate',
        'znk.infra.config'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.auth').factory('AuthService',
        ["ENV", "$q", "$timeout", "$log", "StorageFirebaseAdapter", "StorageSrv", "$http", "$rootScope", function (ENV, $q, $timeout, $log, StorageFirebaseAdapter, StorageSrv, $http, $rootScope) {
            'ngInject';

            var refAuthDB;
            var rootRef;

            var defferd = $q.defer();


            // if (ENV.fbGlobalEndPoint && ENV.fbDataEndPoint){
            //     _init();
  
            // }

            $rootScope.$watch('ENV', function() {
                console.log('ENV changed');
                if (ENV.fbGlobalEndPoint && ENV.fbDataEndPoint){
                    defferd.resolve();
                }
            });

            var _init = function(){
                return defferd.promise.then(function(){
                    refAuthDB = new Firebase(ENV.fbGlobalEndPoint, ENV.firebaseAppScopeName);
                    rootRef = new Firebase(ENV.fbDataEndPoint, ENV.firebaseAppScopeName);
                });
            };
            
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

                refAuthDB.createUser(registration).then(function () {
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

                refAuthDB.unauth();

                refAuthDB.authWithPassword(loginData).then(function (authData) {
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
                refAuthDB.unauth();
                rootRef.unauth();
            };

            authService.forgotPassword = function (forgotPasswordData) {
                return refAuthDB.resetPassword(forgotPasswordData);
            };

            authService.getAuth = function() {

                return _init.then(function(){
                    var authData ={};
                    authData = rootRef.getAuth();
                    if (!authData) {
                        return null;
                    }

                    if (!authData.auth) {
                        authData.auth = {};
                    }

                    if (!authData.password) {
                        authData.password = {};
                    }

                    var userEmail = authData.auth.email || authData.password.email;
                    authData.auth.email = authData.password.email = userEmail;
                    
                    return authData;
                });
                
            };

            authService.changePassword = function (changePasswordData) {
                var refAuthData = refAuthDB.getAuth();
                changePasswordData.email = (refAuthData.password && refAuthData.password.email) ? refAuthData.password.email : '';
                return refAuthDB.changePassword(changePasswordData);
            };

            authService.createAuthWithCustomToken = function (refDB, token) {
                var deferred = $q.defer();
                refDB.authWithCustomToken(token, function (error, userData) {
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
                var firstLoginPath = 'firstLogin/' + authService.getAuth().uid;
                return storageSrv.get(firstLoginPath).then(function (userFirstLoginTime) {
                    if (angular.equals(userFirstLoginTime, {})) {
                        storageSrv.set(firstLoginPath, Date.now());
                    }
                });
            };

            function storageObj (){
                var fbAdapter = new StorageFirebaseAdapter(ENV.fbDataEndPoint + '/' + ENV.firebaseAppScopeName);
                var config = {
                    variables: {
                        uid: function () {
                            return authService.getAuth().uid;
                        }
                    }
                };
                return new StorageSrv(fbAdapter, config);
            }

            function _dataLogin() {
                var postUrl = ENV.backendEndpoint + 'firebase/token';
                var authData = refAuthDB.getAuth();
                var postData = {
                    email: authData.password ? authData.password.email : '',
                    uid: authData.uid,
                    fbDataEndPoint: ENV.fbDataEndPoint,
                    fbEndpoint: ENV.fbGlobalEndPoint,
                    auth: ENV.dataAuthSecret,
                    token: authData.token
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

            return authService;
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.auth')
        .service('AuthHelperService', ["$filter", "ENV", function ($filter, ENV) {
            'ngInject';

            var translateFilter = $filter('translate');
            var excludeDomains = ['mailinator.com'];

            this.errorMessages = {
                DEFAULT_ERROR: translateFilter('AUTH_HELPER.DEFAULT_ERROR_MESSAGE'),
                FB_ERROR: translateFilter('AUTH_HELPER.FACEBOOK_ERROR'),
                EMAIL_EXIST: translateFilter('AUTH_HELPER.EMAIL_EXIST'),
                INVALID_EMAIL: translateFilter('AUTH_HELPER.INVALID_EMAIL'),
                NO_INTERNET_CONNECTION_ERR: translateFilter('AUTH_HELPER.NO_INTERNET_CONNECTION_ERR'),
                EMAIL_NOT_EXIST: translateFilter('AUTH_HELPER.EMAIL_NOT_EXIST'),
                INCORRECT_EMAIL_AND_PASSWORD_COMBINATION: translateFilter('AUTH_HELPER.INCORRECT_EMAIL_AND_PASSWORD_COMBINATION')
            };

            this.isDomainExclude = function (userEmail) {
                var userDomain = userEmail.substr(userEmail.indexOf('@') + 1);
                if (userDomain.toLowerCase() !== 'zinkerz.com' && ENV.enforceZinkerzDomainSignup) {
                    return true;
                }

                var domains = excludeDomains.filter(function (excludeDomain) {
                    return excludeDomain === userDomain;
                });
                return domains.length > 0;
            };
        }]);
})(angular);

angular.module('znk.infra.auth').run([ function () {

}]);
