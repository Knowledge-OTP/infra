(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').service('ScreenSharingSrv',
        function (UserProfileService, InfraConfigSrv, $q, UtilitySrv, ScreenSharingDataGetterSrv, ScreenSharingStatusEnum, ENV, $log, UserScreenSharingStateEnum, ScreenSharingUiSrv) {
            'ngInject';

            var isTeacherApp = (ENV.appContext.toLowerCase()) === 'dashboard';//  to lower case was added in order to

            function _getStorage() {
                return InfraConfigSrv.getGlobalStorage();
            }

            function _getScreenSharingInitStatusByInitiator(initiator) {
                var initiatorToInitStatusMap = {};
                initiatorToInitStatusMap[UserScreenSharingStateEnum.VIEWER.enum] = ScreenSharingStatusEnum.PENDING_SHARER.enum;
                initiatorToInitStatusMap[UserScreenSharingStateEnum.SHARER.enum] = ScreenSharingStatusEnum.PENDING_VIEWER.enum;

                return initiatorToInitStatusMap[initiator] || null;
            }

            function _isScreenSharingAlreadyInitiated(sharerId, viewerId) {
                return ScreenSharingDataGetterSrv.getCurrUserScreenSharingData().then(function (screenSharingDataMap) {
                    var isInitiated = false;
                    var screenSharingDataMapKeys = Object.keys(screenSharingDataMap);
                    for (var i in screenSharingDataMapKeys) {
                        var screenSharingDataKey = screenSharingDataMapKeys[i];
                        var screenSharingData = screenSharingDataMap[screenSharingDataKey];
                        isInitiated = screenSharingData.sharerId === sharerId && screenSharingData.viewerId === viewerId;
                        if (isInitiated) {
                            break;
                        }
                    }
                    return isInitiated;
                });
            }

            function _initiateScreenSharing(sharerData, viewerData, initiator) {
                if (angular.isUndefined(viewerData.isTeacher) || angular.isUndefined(sharerData.isTeacher)) {
                    var errMSg = 'ScreenSharingSrv: isTeacher property was not provided!!!';
                    $log.error(errMSg);
                    return $q.reject(errMSg);
                }

                var initScreenSharingStatus = _getScreenSharingInitStatusByInitiator(initiator);
                if (!initScreenSharingStatus) {
                    return $q.reject('ScreenSharingSrv: initiator was not provided');
                }

                return _isScreenSharingAlreadyInitiated(sharerData.uid, viewerData.uid).then(function (isInitiated) {
                    if (isInitiated) {
                        var errMsg = 'ScreenSharingSrv: screen sharing was already initiated';
                        $log.error(errMsg);
                        return $q.reject(errMsg);
                    }


                    var getDataPromMap = {};

                    getDataPromMap.currUserScreenSharingRequests = ScreenSharingDataGetterSrv.getCurrUserScreenSharingRequests();

                    var newScreenSharingGuid = UtilitySrv.general.createGuid();
                    getDataPromMap.newScreenSharingData = ScreenSharingDataGetterSrv.getScreenSharingData(newScreenSharingGuid);

                    getDataPromMap.currUid = UserProfileService.getCurrUserId();

                    return $q.all(getDataPromMap).then(function (data) {
                        var dataToSave = {};

                        var newScreenSharingData = {
                            guid: newScreenSharingGuid,
                            sharerId: sharerData.uid,
                            viewerId: viewerData.uid,
                            status: initScreenSharingStatus
                        };
                        angular.extend(data.newScreenSharingData, newScreenSharingData);

                        dataToSave[data.newScreenSharingData.$$path] = data.newScreenSharingData;
                        //current user screen sharing requests object update
                        data.currUserScreenSharingRequests[newScreenSharingGuid] = true;
                        dataToSave[data.currUserScreenSharingRequests.$$path] = data.currUserScreenSharingRequests;
                        //other user screen sharing requests object update
                        var otherUserData = viewerData.uid === data.currUid ? sharerData : viewerData;
                        var viewerScreenSharingDataGuidPath = ScreenSharingDataGetterSrv.getUserScreenSharingRequestsPath(otherUserData, newScreenSharingGuid);
                        dataToSave[viewerScreenSharingDataGuidPath] = true;

                        return _getStorage().then(function (StudentStorage) {
                            return StudentStorage.update(dataToSave);
                        });
                    });

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

            this.confirmSharing = function (screenSharingDataGuid) {
                return ScreenSharingDataGetterSrv.getScreenSharingData(screenSharingDataGuid).then(function (screenSharingData) {
                    screenSharingData.status = ScreenSharingStatusEnum.CONFIRMED.enum;
                    return screenSharingData.$save();
                });
            };

            this.endSharing = function (screenSharingDataGuid) {
                return ScreenSharingDataGetterSrv.getScreenSharingData(screenSharingDataGuid).then(function (screenSharingData) {
                    screenSharingData.status = ScreenSharingStatusEnum.ENDED.enum;
                    return screenSharingData.$save();
                });
            };

            this._userScreenSharingStateChanged = function (newUserScreenSharingState) {
                if (newUserScreenSharingState === UserScreenSharingStateEnum.VIEWER.enum) {
                    ScreenSharingUiSrv.showViewerIndication();
                }

                if (newUserScreenSharingState === UserScreenSharingStateEnum.SHARER.enum) {
                    ScreenSharingUiSrv.showSharerIndication();
                }
            };
        }
    );
})(angular);
