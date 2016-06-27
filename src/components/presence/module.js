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
