'use strict';

(function (angular) {
    angular.module('znk.infra.presence').provider('PresenceService', function () {
        
        var AuthSrvName;

        this.setAuthServiceName = function (authServiceName) {
            AuthSrvName = authServiceName;
        };

        this.$get = [
            '$log', '$injector', 'ENV', '$document',
            function ($log, $injector, ENV, $document) {
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

                        $document[0].onIdle = function () {
                            userRef.set(PresenceService.userStatus.IDLE);
                        };
                        $document[0].onAway = function () {
                            userRef.set(PresenceService.userStatus.AWAY);
                        };
                        $document[0].onBack = function () {
                            userRef.set(PresenceService.userStatus.ONLINE);
                        };
                    }
                };

                PresenceService.getUserStatus = function (userId) {
                    return rootRef.child('presence/' + userId);
                };

                return PresenceService;
            }];
    });
})(angular);
