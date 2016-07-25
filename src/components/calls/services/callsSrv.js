(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').service('CallsSrv',
        function (UserProfileService, InfraConfigSrv, $q, UtilitySrv, ENV, $log) {
            'ngInject';

            //@todo(oded) will implement all the api calls to pivlo here
            //var isTeacherApp = (ENV.appContext.toLowerCase()) === 'dashboard';//  to lower case was added in order to
            //
            //function _getStorage() {
            //    return InfraConfigSrv.getGlobalStorage();
            //}
            //
            //function _getScreenSharingInitStatusByInitiator(initiator) {
            //    var initiatorToInitStatusMap = {};
            //    initiatorToInitStatusMap[UserScreenSharingStateEnum.VIEWER.enum] = ScreenSharingStatusEnum.PENDING_SHARER.enum;
            //    initiatorToInitStatusMap[UserScreenSharingStateEnum.SHARER.enum] = ScreenSharingStatusEnum.PENDING_VIEWER.enum;
            //
            //    return initiatorToInitStatusMap[initiator] || null;
            //}
            //
            //function _isScreenSharingAlreadyInitiated(sharerId, viewerId) {
            //    return ScreenSharingDataGetterSrv.getCurrUserScreenSharingData().then(function (screenSharingDataMap) {
            //        var isInitiated = false;
            //        var screenSharingDataMapKeys = Object.keys(screenSharingDataMap);
            //        for (var i in screenSharingDataMapKeys) {
            //            var screenSharingDataKey = screenSharingDataMapKeys[i];
            //            var screenSharingData = screenSharingDataMap[screenSharingDataKey];
            //            isInitiated = screenSharingData.sharerId === sharerId && screenSharingData.viewerId === viewerId;
            //            if (isInitiated) {
            //                break;
            //            }
            //        }
            //        return isInitiated;
            //    });
            //}
            //
            //function _initiateScreenSharing(sharerData, viewerData, initiator) {
            //    if (angular.isUndefined(viewerData.isTeacher) || angular.isUndefined(sharerData.isTeacher)) {
            //        var errMSg = 'ScreenSharingSrv: isTeacher property was not provided!!!';
            //        $log.error(errMSg);
            //        return $q.reject(errMSg);
            //    }
            //
            //    var initScreenSharingStatus = _getScreenSharingInitStatusByInitiator(initiator);
            //    if (!initScreenSharingStatus) {
            //        return $q.reject('ScreenSharingSrv: initiator was not provided');
            //    }
            //
            //    return _isScreenSharingAlreadyInitiated(sharerData.uid, viewerData.uid).then(function (isInitiated) {
            //        if (isInitiated) {
            //            var errMsg = 'ScreenSharingSrv: screen sharing was already initiated';
            //            $log.error(errMsg);
            //            return $q.reject(errMsg);
            //        }
            //
            //
            //        var getDataPromMap = {};
            //
            //        getDataPromMap.currUserScreenSharingRequests = ScreenSharingDataGetterSrv.getCurrUserScreenSharingRequests();
            //
            //        var newScreenSharingGuid = UtilitySrv.general.createGuid();
            //        getDataPromMap.newScreenSharingData = ScreenSharingDataGetterSrv.getScreenSharingData(newScreenSharingGuid);
            //
            //        getDataPromMap.currUid = UserProfileService.getCurrUserId();
            //
            //        return $q.all(getDataPromMap).then(function (data) {
            //            var dataToSave = {};
            //
            //            var viewerPath = ScreenSharingDataGetterSrv.getUserScreenSharingRequestsPath(viewerData, newScreenSharingGuid);
            //            var sharerPath = ScreenSharingDataGetterSrv.getUserScreenSharingRequestsPath(sharerData, newScreenSharingGuid);
            //            var newScreenSharingData = {
            //                guid: newScreenSharingGuid,
            //                sharerId: sharerData.uid,
            //                viewerId: viewerData.uid,
            //                status: initScreenSharingStatus,
            //                viewerPath: viewerPath,
            //                sharerPath: sharerPath
            //            };
            //            angular.extend(data.newScreenSharingData, newScreenSharingData);
            //
            //            dataToSave[data.newScreenSharingData.$$path] = data.newScreenSharingData;
            //            //current user screen sharing requests object update
            //            data.currUserScreenSharingRequests[newScreenSharingGuid] = true;
            //            dataToSave[data.currUserScreenSharingRequests.$$path] = data.currUserScreenSharingRequests;
            //            //other user screen sharing requests object update
            //            var otherUserScreenSharingPath = viewerData.uid === data.currUid ? sharerPath: viewerPath;
            //            var viewerScreenSharingDataGuidPath = otherUserScreenSharingPath + '/' + newScreenSharingGuid;
            //            dataToSave[viewerScreenSharingDataGuidPath] = true;
            //
            //            return _getStorage().then(function (StudentStorage) {
            //                return StudentStorage.update(dataToSave);
            //            });
            //        });
            //
            //    });
            //}
            //
            //this.shareMyScreen = function (viewerData) {
            //    return UserProfileService.getCurrUserId().then(function (currUserId) {
            //        var sharerData = {
            //            uid: currUserId,
            //            isTeacher: isTeacherApp
            //        };
            //        return _initiateScreenSharing(sharerData, viewerData, UserScreenSharingStateEnum.SHARER.enum);
            //    });
            //};
            //
            //this.viewOtherUserScreen = function (sharerData) {
            //    return UserProfileService.getCurrUserId().then(function (currUserId) {
            //        var viewerData = {
            //            uid: currUserId,
            //            isTeacher: isTeacherApp
            //        };
            //        return _initiateScreenSharing(sharerData, viewerData, UserScreenSharingStateEnum.VIEWER.enum);
            //    });
            //};
            //
            //this.confirmSharing = function (screenSharingDataGuid) {
            //    return ScreenSharingDataGetterSrv.getScreenSharingData(screenSharingDataGuid).then(function (screenSharingData) {
            //        screenSharingData.status = ScreenSharingStatusEnum.CONFIRMED.enum;
            //        return screenSharingData.$save();
            //    });
            //};
            //
            //this.endSharing = function (screenSharingDataGuid) {
            //    var getDataPromMap = {};
            //    getDataPromMap.screenSharingData = ScreenSharingDataGetterSrv.getScreenSharingData(screenSharingDataGuid);
            //    getDataPromMap.currUid = UserProfileService.getCurrUserId();
            //    getDataPromMap.currUidScreenSharingRequests = ScreenSharingDataGetterSrv.getCurrUserScreenSharingRequests();
            //    getDataPromMap.storage = _getStorage();
            //    return $q.all(getDataPromMap).then(function (data) {
            //        var dataToSave = {};
            //
            //        data.screenSharingData.status = ScreenSharingStatusEnum.ENDED.enum;
            //        dataToSave [data.screenSharingData.$$path] = data.screenSharingData;
            //
            //        data.currUidScreenSharingRequests[data.screenSharingData.guid] = false;
            //        dataToSave[data.currUidScreenSharingRequests.$$path] = data.currUidScreenSharingRequests;
            //
            //        var otherUserScreenSharingRequestPath;
            //        if(data.screenSharingData.viewerId !== data.currUid){
            //            otherUserScreenSharingRequestPath = data.screenSharingData.viewerPath;
            //        }else{
            //            otherUserScreenSharingRequestPath = data.screenSharingData.sharerPath;
            //        }
            //        otherUserScreenSharingRequestPath += '/' + data.screenSharingData.guid;
            //        dataToSave[otherUserScreenSharingRequestPath] = false;
            //
            //        return data.storage.update(dataToSave);
            //    });
            //};
            //
            //this._userScreenSharingStateChanged = function (newUserScreenSharingState) {
            //    if(!newUserScreenSharingState){
            //        return;
            //    }
            //    ScreenSharingUiSrv.activateScreenSharing(newUserScreenSharingState);
            //};
        }
    );
})(angular);
