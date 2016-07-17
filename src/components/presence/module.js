(function (angular) {
    'use strict';

    angular.module('znk.infra.presence', ['ngIdle'])
        .config([
            'IdleProvider', 'KeepaliveProvider', 'ENV',
            function (IdleProvider, KeepaliveProvider, ENV) {
                // userIdleTime: how many sec until user is 'IDLE'
                // idleTimeout: how many sec after idle to stop track the user, 0: keep track
                // idleKeepalive: keepalive interval in sec

                IdleProvider.idle(ENV.userIdleTime || 30);
                IdleProvider.timeout(ENV.idleTimeout || 0);
                KeepaliveProvider.interval(ENV.idleKeepalive || 2);
            }])
        .run([
            'PresenceService', 'Idle',
            function (PresenceService, Idle) {
                PresenceService.addCurrentUserListeners();
                Idle.watch();
            }
        ]);
})(angular);
