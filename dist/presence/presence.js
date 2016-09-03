(function (angular) {
    'use strict';

    angular.module('znk.infra.presence', ['ngIdle'])
        .config([
            'IdleProvider', 'KeepaliveProvider',
            function (IdleProvider, KeepaliveProvider) {
                // userIdleTime: how many sec until user is 'IDLE'
                // idleTimeout: how many sec after idle to stop track the user, 0: keep track
                // idleKeepalive: keepalive interval in sec

                IdleProvider.idle( 30);
                IdleProvider.timeout( 0);
                KeepaliveProvider.interval(2);
            }])
        .run([
            'PresenceService', 'Idle',
            function (PresenceService, Idle) {
                PresenceService.addCurrentUserListeners();
                Idle.watch();
            }
        ]);
})(angular);

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
                var PresenceService = {};
                var rootRef = new StorageFirebaseAdapter(ENV.fbDataEndPoint);
                var PRESENCE_PATH = 'presence/';

                PresenceService.userStatus = {
                    'OFFLINE': 0,
                    'ONLINE': 1,
                    'IDLE': 2
                };

                function getAuthData() {
                    var authData;
                    var authService = $injector.get(AuthSrvName);
                    if (angular.isObject(authService)) {
                        authData =  authService.getAuth();
                    }
                    return authData;
                }

                PresenceService.addCurrentUserListeners = function () {
                    var authData = getAuthData();
                    if (authData) {
                        var amOnline = rootRef.getRef('.info/connected');
                        var userRef = rootRef.getRef(PRESENCE_PATH + authData.uid);
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
                    return rootRef.getRef(PRESENCE_PATH + userId).once('value').then(function(snapshot) {
                        return (snapshot.val()) || PresenceService.userStatus.OFFLINE;
                    });
                };

                PresenceService.startTrackUserPresence = function (userId, cb) {
                    var userRef = rootRef.getRef(PRESENCE_PATH + userId);
                    userRef.on('value', trackUserPresenceCB.bind(null, cb, userId));
                };

                PresenceService.stopTrackUserPresence = function (userId) {
                    var userRef = rootRef.getRef(PRESENCE_PATH + userId);
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

                $rootScope.$on('auth:beforeLogout', function () {
                    var authData = getAuthData();
                    if (authData) {
                        var userRef = rootRef.getRef(PRESENCE_PATH + authData.uid);
                        userRef.remove();
                    }
                });

                return PresenceService;
            }];
    });
})(angular);

angular.module('znk.infra.presence').run(['$templateCache', function($templateCache) {

}]);
