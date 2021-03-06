(function (angular) {
    'use strict';

    angular.module('znk.infra.presence', [
        'ngIdle',
        'znk.infra.auth'
    ])
        .config(function (IdleProvider, KeepaliveProvider) {
            // userIdleTime: how many sec until user is 'IDLE'
            // idleTimeout: how many sec after idle to stop track the user, 0: keep track
            // idleKeepalive: keepalive interval in sec

            IdleProvider.idle(30);
            IdleProvider.timeout(0);
            KeepaliveProvider.interval(2);
        })
        .run(function (PresenceService, Idle) {
            'ngInject';
                PresenceService.addCurrentUserListeners();
                Idle.watch();
            }
        );
})(angular);
