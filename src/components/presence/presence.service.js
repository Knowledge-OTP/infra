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

                presenceService.userStatus = {
                    'OFFLINE': 0,
                    'ONLINE': 1,
                    'IDLE': 2
                };

                presenceService.addCurrentUserListeners = function () {
                    var authData = getAuthData();
                    if (authData) {
                        var amOnline = rootRef.getRef('.info/connected');
                        var userRef = rootRef.getRef(PRESENCE_PATH + authData.uid);
                        amOnline.on('value', function (snapshot) {
                            if (snapshot.val()) {
                                userRef.onDisconnect().remove();
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
                };

                presenceService.getCurrentUserStatus = function (userId) {
                    return rootRef.getRef(PRESENCE_PATH + userId).once('value').then(function(snapshot) {
                        return (snapshot.val()) || presenceService.userStatus.OFFLINE;
                    });
                };

                presenceService.startTrackUserPresence = function (userId, cb) {
                    var userRef = rootRef.getRef(PRESENCE_PATH + userId);
                    userRef.on('value', trackUserPresenceCB.bind(null, cb, userId));
                };

                presenceService.stopTrackUserPresence = function (userId) {
                    var userRef = rootRef.getRef(PRESENCE_PATH + userId);
                    userRef.off('value', trackUserPresenceCB);
                };

                function getAuthData() {
                    var authData;
                    var authService = $injector.get(AuthSrvName);
                    if (angular.isObject(authService)) {
                        authData =  authService.getAuth();
                    }
                    return authData;
                }

                function trackUserPresenceCB(cb, userId, snapshot) {
                    if (angular.isFunction(cb)) {
                        var status = presenceService.userStatus.OFFLINE;
                        if (snapshot && snapshot.val()){
                            status = snapshot.val();
                        }
                        cb(status, userId);
                    }
                }

                $rootScope.$on('auth:beforeLogout', function () {
                    var authData = getAuthData();
                    if (authData) {
                        var userRef = rootRef.getRef(PRESENCE_PATH + authData.uid);
                        userRef.remove();
                    }
                });

                return presenceService;
            }];
    });
})(angular);
