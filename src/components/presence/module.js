(function (angular) {
    'use strict';

    angular.module('znk.infra.presence', [])
        .run([
            'PresenceService',
            function (PresenceService) {
                PresenceService.addListeners();
            }
        ]);
})(angular);
