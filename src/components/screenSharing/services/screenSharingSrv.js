(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').service('ScreenSharingSrv',
        function (UserProfileService, InfraConfigSrv, $q, UtilitySrv, ScreenSharingDataGetterSrv, ScreenSharingStatusEnum) {
            'ngInject';

            var INITIATOR_ENUM = {
                "VIEWER": 1,
                "SHARER": 2
            };
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

            function _initiateScreenSharing(sharerId, viewerId, initiator) {
                var dataToSave = {};

                var newScreenSharingGuid = UtilitySrv.general.createGuid();

                var initStatus = _getScreenSharingInitStatusByInitiator(initiator);
                if(!initStatus ){
                    return $q.reject('ScreenSharingSrv: initiator was not provided');
                }
                var newScreenSharingData = {
                    guid: newScreenSharingGuid,
                    sharerId: sharerId,
                    viewerId: viewerId,
                    status: initStatus
                };
                var newScreenSharingDataPath = ScreenSharingDataGetterSrv.getScreenSharingDataPath(newScreenSharingGuid);
                dataToSave[newScreenSharingDataPath] = newScreenSharingData;

                var sharerScreenSharingDataGuidPath = ScreenSharingDataGetterSrv.getUserScreenSharingDataGuidPath(sharerId, newScreenSharingGuid);
                dataToSave[sharerScreenSharingDataGuidPath] = true;

                var viewerScreenSharingDataGuidPath = ScreenSharingDataGetterSrv.getUserScreenSharingDataGuidPath(viewerId, newScreenSharingGuid);
                dataToSave[viewerScreenSharingDataGuidPath] = true;

                return _getStorage().then(function(StudentStorage){
                    return StudentStorage.set(dataToSave);
                });
            }

            this.shareMyScreen = function (viewerId) {
                return UserProfileService.getCurrUserId().then(function (currUserId) {
                    return _initiateScreenSharing(currUserId, viewerId, INITIATOR_ENUM.SHARER);
                });
            };

            this.viewOtherUserScreen = function (sharerId) {
                return UserProfileService.getCurrUserId().then(function (currUserId) {
                    return _initiateScreenSharing(sharerId, currUserId, INITIATOR_ENUM.VIEWER);
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
