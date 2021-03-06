'use strict';

(function (angular) {
    angular.module('znk.infra.presence').provider('PresenceService', function () {

        var AuthSrvName;

        this.setAuthServiceName = function (authServiceName) {
            AuthSrvName = authServiceName;
        };

        this.$get = [
            '$log', '$injector', 'ENV', '$rootScope', 'StorageFirebaseAdapter',
            function ($log, $injector, ENV, $rootScope, StorageFirebaseAdapter) {
                var presenceService = {};
                var rootRef = new StorageFirebaseAdapter(ENV.fbDataEndPoint);
                var PRESENCE_PATH = 'presence/';
                var isUserLoguot = false;

                presenceService.userStatus = {
                    'OFFLINE': 0,
                    'ONLINE': 1,
                    'IDLE': 2
                };


                presenceService.addCurrentUserListeners = function () {
                    getAuthData().then(authData => {
                        if (authData) {
                            var amOnline = rootRef.getRef('.info/connected');
                            var userRef = rootRef.getRef(PRESENCE_PATH + authData.uid);
                            amOnline.on('value', function (snapshot) {
                                if (snapshot.val()) {
                                    userRef.onDisconnect().remove();
                                    userRef.set(presenceService.userStatus.ONLINE);
                                }
                            });

                            // added listener for the user to resolve the problem when other tabs are closing
                            // it removes user presence status, turning him offline, although his still online
                            userRef.on('value', function(snapshot) {
                                var val = snapshot.val();
                                if (!val && !isUserLoguot) {
                                    userRef.set(presenceService.userStatus.ONLINE);
                                }
                            });

                            $rootScope.$on('IdleStart', function() {
                                userRef.set(presenceService.userStatus.IDLE);
                            });

                            $rootScope.$on('IdleEnd', function() {
                                userRef.set(presenceService.userStatus.ONLINE);
                            });
                        }
                    });
                };

                presenceService.getCurrentUserStatus = function (userId) {
                    return rootRef.getRef(PRESENCE_PATH + userId).once('value').then(function(snapshot) {
                        return (snapshot.val()) || presenceService.userStatus.OFFLINE;
                    });
                };

                presenceService.startTrackUserPresence = function (userId, cb) {
                    const userRef = rootRef.getRef(PRESENCE_PATH + userId);
                    userRef.on('value', cb);
                };

                presenceService.stopTrackUserPresence = function (userId, cb) {
                    const userRef = rootRef.getRef(PRESENCE_PATH + userId);
                    userRef.off('value', cb);
                };

                function getAuthData() {
                    var authData;
                    var authService = $injector.get(AuthSrvName);
                    if (angular.isObject(authService)) {
                         return authService.getAuth();
                    }
                    else {
                        return new Promise(resolve => resolve(authData));
                    }
                }

                $rootScope.$on('auth:beforeLogout', function () {
                    getAuthData().then(authData => {
                        if (authData) {
                            var userRef = rootRef.getRef(PRESENCE_PATH + authData.uid);
                            isUserLoguot = true;
                            userRef.remove();
                        }
                    });
                });

                return presenceService;
            }];
    });
})(angular);
