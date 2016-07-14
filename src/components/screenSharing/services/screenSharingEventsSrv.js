(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').service('ScreenSharingEventsrSrv',
        function (UserProfileService, InfraConfigSrv, $q, StorageSrv, ENV) {
            'ngInject';

            function _startListening(){
                UserProfileService.getCurrUserId().then(function (currUid) {
                    $q.when(InfraConfigSrv.getStorageService()).then(function(storage){
                        var appName = ENV.firebaseAppScopeName;
                        var userScreenSharingPath = appName + '/users/' + currUid +'/screenSharing';
                        storage.onEvent(StorageSrv.EVENTS.VALUE, userScreenSharingPath, function(){

                        });
                    });
                });
            }

            this.activate = function(){

            };
        }
    );
})(angular);
