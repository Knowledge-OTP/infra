'use strict';

(function (angular) {
    angular.module('znk.infra.presence').provider('PresenceService', function () {

        var AuthSrvName;

        this.setAuthServiceName = function (authServiceName) {
            AuthSrvName = authServiceName;
        };

        this.$get = [
            '$log', '$injector', 'ENV', '$rootScope',
            function ($log, $injector, ENV, $rootScope) {
                var PresenceService = {};
                // @todo: can we use storageFirebaseAdapter here???
                var rootRef = new Firebase(ENV.fbDataEndPoint, ENV.firebaseAppScopeName);
                var PRESENCE_PATH = 'presence/';

                PresenceService.userStatus = {
                    'OFFLINE': 0,
                    'ONLINE': 1,
                    'IDLE': 2
                };

                function getAuthData() {
                    var authData;
                    var authService = $injector.get(AuthSrvName);
                    if (angular.isFunction(authService)) {
                        authData =  authService.getAuth();
                    }
                    return authData;
                }

                PresenceService.addCurrentUserListeners = function () {
                    var authData = getAuthData();
                    if (authData) {
                        var amOnline = rootRef.child('.info/connected');
                        var userRef = rootRef.child(PRESENCE_PATH + authData.uid);
                        amOnline.on('value', function (snapshot) {
                            if (snapshot.val()) {
                                userRef.onDisconnect().remove();
                                userRef.set(PresenceService.userStatus.ONLINE);
                            }
                        });

                        $rootScope.$on('IdleStart', function() {
                            userRef.set(PresenceService.userStatus.IDLE);
                        });

                        $rootScope.$on('IdleEnd', function() {
                            userRef.set(PresenceService.userStatus.ONLINE);
                        });
                    }
                };

                PresenceService.getCurrentUserStatus = function (userId) {
                    return rootRef.child(PRESENCE_PATH + userId).once('value').then(function(snapshot) {
                        return (snapshot.val()) || PresenceService.userStatus.OFFLINE;
                    });
                };

                PresenceService.startTrackUserPresence = function (userId, cb) {
                    var userRef = rootRef.child(PRESENCE_PATH + userId);
                    userRef.on('value', trackUserPresenceCB.bind(null, cb, userId));
                };

                PresenceService.stopTrackUserPresence = function (userId) {
                    var userRef = rootRef.child(PRESENCE_PATH + userId);
                    userRef.off('value', trackUserPresenceCB);
                };

                function trackUserPresenceCB(cb, userId, snapshot) {
                    if (angular.isFunction(cb)) {
                        var status = PresenceService.userStatus.OFFLINE;
                        if (snapshot && snapshot.val()){
                            status = snapshot.val();
                        }
                        cb(status, userId);
                    }
                }

                return PresenceService;
            }];
    });
})(angular);
