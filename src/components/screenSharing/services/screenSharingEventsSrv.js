(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').service('ScreenSharingEventsrSrv',
        function (UserProfileService, InfraConfigSrv, $q, StorageSrv, ENV) {
            'ngInject';

            function _startListening(){
                UserProfileService.getCurrUserId().then(function (currUid) {
                    InfraConfigSrv.getGlobalStorage().then(function(globalStorage){
                        var appName = ENV.firebaseAppScopeName;
                        var userScreenSharingPath = appName + '/users/' + currUid +'/screenSharing';
                        globalStorage.onEvent(StorageSrv.EVENTS.VALUE, userScreenSharingPath, function(userScreenSharingData){
                            if(!userScreenSharingData){
                                return;
                            }
                        });
                    });
                });
            }

            this.activate = function(){
                _startListening();
            };
        }
    );
})(angular);
