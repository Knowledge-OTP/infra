(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').service('ScreenSharingDataGetterSrv',
        function (InfraConfigSrv, $q, ENV) {
            'ngInject';

            //todo for easier upgrade to version-5
            function _getStorage() {
                return $q.when(InfraConfigSrv.getStorageService());
            }

            this.getScreenSharingDataPath = function (guid) {
                var SCREEN_SHARING_ROOT_PATH = 'screenSharing';
                return SCREEN_SHARING_ROOT_PATH + '/' + guid;
            };

            this.getUserScreenSharingDataGuidPath = function (userData, guid) {
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
        }
    );
})(angular);
