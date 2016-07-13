(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').service('ScreenSharingSrv',
        function (UserProfileService, InfraConfigSrv, $q, UtilitySrv, ScreenSharingDataGetterSrv, ScreenSharingStatusEnum, ENV, $log) {
            'ngInject';

            var INITIATOR_ENUM = {
                "VIEWER": 1,
                "SHARER": 2
            };

            var isDashboardApp = ENV.appContext === 'dashboard';

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
                        isTeacher: isDashboardApp
                    };
                    return _initiateScreenSharing(sharerData, viewerData, INITIATOR_ENUM.SHARER);
                });
            };

            this.viewOtherUserScreen = function (sharerData) {
                return UserProfileService.getCurrUserId().then(function (currUserId) {
                    var viewerData = {
                        uid: currUserId,
                        isTeacher: isDashboardApp
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
        }
    );
})(angular);
