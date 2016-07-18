(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').service('ScreenSharingSrv',
        function (UserProfileService, InfraConfigSrv, $q, UtilitySrv, ScreenSharingDataGetterSrv, ScreenSharingStatusEnum, ENV, $log, UserScreenSharingStateEnum, ScreenSharingUiSrv) {
            'ngInject';

            var isTeacherApp = (ENV.appContext.toLowerCase()) === 'dashboard';//  to lower case was added in order to

            function _getStorage(){
                return InfraConfigSrv.getGlobalStorage();
            }

            function _getScreenSharingInitStatusByInitiator(initiator){
                var initiatorToInitStatusMap = {};
                initiatorToInitStatusMap[UserScreenSharingStateEnum.VIEWER.enum] = ScreenSharingStatusEnum.PENDING_SHARER.enum;
                initiatorToInitStatusMap[UserScreenSharingStateEnum.SHARER.enum] = ScreenSharingStatusEnum.PENDING_VIEWER.enum;

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
                    return StudentStorage.update(dataToSave);
                });
            }

            this.shareMyScreen = function (viewerData) {
                return UserProfileService.getCurrUserId().then(function (currUserId) {
                    var sharerData = {
                        uid: currUserId,
                        isTeacher: isTeacherApp
                    };
                    return _initiateScreenSharing(sharerData, viewerData, UserScreenSharingStateEnum.SHARER.enum);
                });
            };

            this.viewOtherUserScreen = function (sharerData) {
                return UserProfileService.getCurrUserId().then(function (currUserId) {
                    var viewerData = {
                        uid: currUserId,
                        isTeacher: isTeacherApp
                    };
                    return _initiateScreenSharing(sharerData, viewerData, UserScreenSharingStateEnum.VIEWER.enum);
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

            this._setUserScreenSharingState = function(newUserScreenSharingState){
                if(newUserScreenSharingState === UserScreenSharingStateEnum.VIEWER.enum){
                    ScreenSharingUiSrv.showViewerIndication();
                }

                if(newUserScreenSharingState === UserScreenSharingStateEnum.SHARER.enum){
                    ScreenSharingUiSrv.showSharerIndication();
                }
            };
        }
    );
})(angular);
