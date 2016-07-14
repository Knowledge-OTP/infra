(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing', [
        'znk.infra.user',
        'znk.infra.utility',
        'znk.infra.config'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').factory('ScreenSharingStatusEnum',
        ["EnumSrv", function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['PENDING_VIEWER', 1, 'pending viewer'],
                ['PENDING_SHARER', 2, 'pending sharer'],
                ['CONFIRMED', 3, 'confirmed'],
                ['ENDED', 4, 'ended']
            ]);
        }]
    );
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').service('ScreenSharingDataGetterSrv',
        ["InfraConfigSrv", "$q", "ENV", function (InfraConfigSrv, $q, ENV) {
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
        }]
    );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').service('ScreenSharingSrv',
        ["UserProfileService", "InfraConfigSrv", "$q", "UtilitySrv", "ScreenSharingDataGetterSrv", "ScreenSharingStatusEnum", "ENV", "$log", function (UserProfileService, InfraConfigSrv, $q, UtilitySrv, ScreenSharingDataGetterSrv, ScreenSharingStatusEnum, ENV, $log) {
            'ngInject';

            var INITIATOR_ENUM = {
                "VIEWER": 1,
                "SHARER": 2
            };

            var isTeacherApp = (ENV.appContext.toLowerCase()) === 'dashboard';//  to lower case was added in order to 

            //todo for easier upgrade to version-5
            function _getStorage(){
                return $q.when(InfraConfigSrv.getStorageService());
            }

            function _getScreenSharingInitStatusByInitiator(initiator){
                var initiatorToInitStatusMap = {};
                initiatorToInitStatusMap[INITIATOR_ENUM.VIEWER] = ScreenSharingStatusEnum.PENDING_SHARER.enum;
                initiatorToInitStatusMap[INITIATOR_ENUM.SHARER] = ScreenSharingStatusEnum.PENDING_VIEWER.enum;

                return initiatorToInitStatusMap[initiator] || null;
            }

            function _initiateScreenSharing(sharerData, viewerData, initiator) {
                if(angular.isUndefined(viewerData.isTeacher) || angular.isUndefined(sharerData.isTeacher)){
                    var errMSg = 'ScreenSharingSrv: isTeacher property was not provided!!!';
                    $log.error(errMSg);
                    return $q.reject(errMSg);
                }
                var dataToSave = {};

                var newScreenSharingGuid = UtilitySrv.general.createGuid();

                var initStatus = _getScreenSharingInitStatusByInitiator(initiator);
                if(!initStatus ){
                    return $q.reject('ScreenSharingSrv: initiator was not provided');
                }
                var newScreenSharingData = {
                    guid: newScreenSharingGuid,
                    sharerId: sharerData.uid,
                    viewerId: viewerData.uid,
                    status: initStatus
                };
                var newScreenSharingDataPath = ScreenSharingDataGetterSrv.getScreenSharingDataPath(newScreenSharingGuid);
                dataToSave[newScreenSharingDataPath] = newScreenSharingData;

                var sharerScreenSharingDataGuidPath = ScreenSharingDataGetterSrv.getUserScreenSharingDataGuidPath(sharerData, newScreenSharingGuid);
                dataToSave[sharerScreenSharingDataGuidPath] = true;

                var viewerScreenSharingDataGuidPath = ScreenSharingDataGetterSrv.getUserScreenSharingDataGuidPath(viewerData, newScreenSharingGuid);
                dataToSave[viewerScreenSharingDataGuidPath] = true;

                return _getStorage().then(function(StudentStorage){
                    return StudentStorage.set(dataToSave);
                });
            }

            this.shareMyScreen = function (viewerData) {
                return UserProfileService.getCurrUserId().then(function (currUserId) {
                    var sharerData = {
                        uid: currUserId,
                        isTeacher: isTeacherApp
                    };
                    return _initiateScreenSharing(sharerData, viewerData, INITIATOR_ENUM.SHARER);
                });
            };

            this.viewOtherUserScreen = function (sharerData) {
                return UserProfileService.getCurrUserId().then(function (currUserId) {
                    var viewerData = {
                        uid: currUserId,
                        isTeacher: isTeacherApp
                    };
                    return _initiateScreenSharing(sharerData, viewerData, INITIATOR_ENUM.VIEWER);
                });
            };

            this.confirmSharing = function(screenSharingDataGuid){
                return ScreenSharingDataGetterSrv.getScreenSharingData(screenSharingDataGuid).then(function(screenSharingData){
                    screenSharingData.status = ScreenSharingStatusEnum.CONFIRMED.enum;
                    return screenSharingData.$save();
                });
            };

            this.endSharing = function(screenSharingDataGuid){
                return ScreenSharingDataGetterSrv.getScreenSharingData(screenSharingDataGuid).then(function(screenSharingData){
                    screenSharingData.status = ScreenSharingStatusEnum.ENDED.enum;
                    return screenSharingData.$save();
                });
            };
        }]
    );
})(angular);

angular.module('znk.infra.screenSharing').run(['$templateCache', function($templateCache) {

}]);
