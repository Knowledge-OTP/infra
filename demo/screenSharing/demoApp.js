(function (angular) {
    'use strict';

    angular.module('demo', [
        'demoEnv',
        'znk.infra.screenSharing'
    ])
    .config(function(ScreenSharingUiSrvProvider){
        'ngInject';

        ScreenSharingUiSrvProvider.setScreenSharingViewerTemplate('<div style="color: white">Screen sharing Viewer template</div>');
    })
    .run(function ($rootScope, ScreenSharingUiSrv) {
        $rootScope.activateSharing = function (userSharingState) {
            ScreenSharingUiSrv.activateScreenSharing(userSharingState).then(function(){
                ScreenSharingUiSrv.endScreenSharing();
            });
        };

        $rootScope.endSharing = function(){
            ScreenSharingUiSrv.endScreenSharing();
        };

        $rootScope.showScreenSharingConfirmationPopUp = function () {
            ScreenSharingUiSrv.showScreenSharingConfirmationPopUp().then(function(popUpInstance){
                popUpInstance.promise.then(function(){
                    alert('resolve');
                },function(){
                    alert('reject');
                });
            },function(){
                alert('reject');
            });
        };

        $rootScope.activateSharing(2);
    });
})(angular);
