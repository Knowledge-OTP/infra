(function (angular) {
    'use strict';

    angular.module('znk.infra.presence', [])
        .config([
            'IdleProvider', 'KeepaliveProvider',
            function (IdleProvider, KeepaliveProvider) {
                // time in sec
                IdleProvider.idle(5);
                IdleProvider.timeout(0);
                KeepaliveProvider.interval(2);
            }])
        .run([
            'PresenceService', 'Idle',
            function (PresenceService, Idle) {
                PresenceService.addListeners();
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
            '$log', '$injector', 'ENV', '$rootScope',
            function ($log, $injector, ENV, $rootScope) {
                var PresenceService = {};
                var authService = $injector.get(AuthSrvName);
                var rootRef = new Firebase(ENV.fbDataEndPoint, ENV.firebaseAppScopeName);

                PresenceService.userStatus = {
                    'OFFLINE': 0,
                    'ONLINE': 1,
                    'IDLE': 2,
                    'AWAY': 3
                };

                PresenceService.addListeners = function () {
                    var authData = authService.getAuth();
                    if (authData) {

                        var amOnline = rootRef.child('.info/connected');
                        var userRef = rootRef.child('presence/' + authData.uid);
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

                        $rootScope.$on('IdleTimeout', function() {
                            userRef.set(PresenceService.userStatus.AWAY);
                        });
                    }
                };

                PresenceService.getUserStatus = function (userId) {
                    return rootRef.child('presence/' + userId);
                };

                return PresenceService;
            }];
    });
})(angular);

angular.module('znk.infra.presence').run(['$templateCache', function($templateCache) {

}]);
