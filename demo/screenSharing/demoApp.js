(function (angular) {
    'use strict';

    angular.module('demo', [
        'znk.infra.screenSharing'
    ])
        .run(function ($rootScope, ScreenSharingUiSrv) {
            $rootScope.activateSharing = function (userSharingState) {
                ScreenSharingUiSrv.activateScreenSharing(userSharingState);
            };

            $rootScope.endSharing = function(){
                ScreenSharingUiSrv.endScreenSharing();
            };
        });
})(angular);
