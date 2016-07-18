(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').service('ScreenSharingDataGetterSrv',
        function (InfraConfigSrv, $q, ENV, UserProfileService) {
            'ngInject';

            function _getStorage() {
                return InfraConfigSrv.getGlobalStorage();
            }

            this.getScreenSharingDataPath = function (guid) {
                var SCREEN_SHARING_ROOT_PATH = 'screenSharing';
                return SCREEN_SHARING_ROOT_PATH + '/' + guid;
            };

            this.getUserScreenSharingDataPath  = function (userData, guid) {
                var appName = userData.isTeacher ? ENV.dashboardAppName : ENV.studentAppName;
                var USER_DATA_PATH = appName  + '/users/' + userData.uid;
                return USER_DATA_PATH + '/screenSharing/' + guid;
            };

            this.getScreenSharingData = function (screenSharingGuid) {
                var screenSharingDataPath = this.getScreenSharingDataPath(screenSharingGuid);
                return _getStorage().then(function (StudentStorage) {
                    return StudentStorage.get(screenSharingDataPath);
                });
            };

            this.getCurrUserScreenSharingData = function () {
                var self = this;
                return UserProfileService.getCurrUserId().then(function(currUid){
                    return _getStorage().then(function(storage){
                        var currUserScreenSharingDataPath = ENV.firebaseAppScopeName + '/users/' + currUid + '/screenSharing';
                        return storage.get(currUserScreenSharingDataPath).then(function(currUserScreenSharingData){
                            var screenSharingDataPromMap = {};
                            angular.forEach(currUserScreenSharingData, function(isActive, guid){
                                if(isActive){
                                    screenSharingDataPromMap[guid] = self.getScreenSharingData(guid);
                                }
                            });

                            return $q.all(screenSharingDataPromMap);
                        });
                    })
                });
            };
        }
    );
})(angular);
