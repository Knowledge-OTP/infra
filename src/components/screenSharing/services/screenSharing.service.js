(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').service('ScreenSharingSrv',
        function (UserProfileService, InfraConfigSrv, $q, UtilitySrv, ScreenSharingDataGetterSrv, ScreenSharingStatusEnum, ENV, $log, UserScreenSharingStateEnum, ScreenSharingUiSrv) {
            'ngInject';

            var _this = this;

            var activeScreenSharingDataFromAdapter = null;
            var currUserScreenSharingState = UserScreenSharingStateEnum.NONE.enum;
            var registeredCbToActiveScreenSharingDataChanges = [];
            var registeredCbToCurrUserScreenSharingStateChange = [];

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

                        var isEnded = screenSharingData.status === ScreenSharingStatusEnum.ENDED.enum;
                        if (isEnded) {
                            _this.endSharing(screenSharingData.guid);
                            continue;
                        }

                        isInitiated = screenSharingData.sharerId === sharerId && screenSharingData.viewerId === viewerId;
                        if (isInitiated) {
                            break;
                        }
                    }
                    return isInitiated;
                });
            }

            function _initiateScreenSharing(sharerData, viewerData, initiator) {
                var errMsg;

                if (angular.isUndefined(viewerData.isTeacher) || angular.isUndefined(sharerData.isTeacher)) {
                    errMsg = 'ScreenSharingSrv: isTeacher property was not provided!!!';
                    $log.error(errMsg);
                    return $q.reject(errMsg);
                }

                if (currUserScreenSharingState !== UserScreenSharingStateEnum.NONE.enum) {
                    errMsg = 'ScreenSharingSrv: screen sharing is already active!!!';
                    $log.debug(errMsg);
                    return $q.reject(errMsg);
                }

                var initScreenSharingStatus = _getScreenSharingInitStatusByInitiator(initiator);
                if (!initScreenSharingStatus) {
                    errMsg = 'ScreenSharingSrv: initiator was not provided';
                    $log.error(errMsg);
                    return $q.reject(errMsg);
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

                        var viewerActivePath = ScreenSharingDataGetterSrv.getUserScreenSharingRequestsPath(viewerData);
                        var sharerActivePath = ScreenSharingDataGetterSrv.getUserScreenSharingRequestsPath(sharerData);
                        var viewerArchivePath = ScreenSharingDataGetterSrv.getUserScreenSharingArchivePath(viewerData);
                        var sharerArchivePath = ScreenSharingDataGetterSrv.getUserScreenSharingArchivePath(sharerData);
                        var newScreenSharingData = {
                            guid: newScreenSharingGuid,
                            sharerId: sharerData.uid,
                            viewerId: viewerData.uid,
                            status: initScreenSharingStatus,
                            viewerActivePath: viewerActivePath,
                            sharerActivePath: sharerActivePath,
                            viewerArchivePath: viewerArchivePath,
                            sharerArchivePath: sharerArchivePath
                        };

                        // update root screen sharing object
                        angular.extend(data.newScreenSharingData, newScreenSharingData);
                        dataToSave[data.newScreenSharingData.$$path] = data.newScreenSharingData;

                        // update viewerActivePath
                        var viewerActiveGuidPath = viewerActivePath + '/' + newScreenSharingGuid;
                        dataToSave[viewerActiveGuidPath] = true;
                        // update sharerActivePath
                        var sharerActiveGuidPath = sharerActivePath + '/' + newScreenSharingGuid;
                        dataToSave[sharerActiveGuidPath] = true;

                        return _getStorage().then(function (StudentStorage) {
                            return StudentStorage.update(dataToSave);
                        });
                    });

                });
            }

            function _cleanRegisteredCbToActiveScreenSharingData() {
                activeScreenSharingDataFromAdapter = null;
                registeredCbToActiveScreenSharingDataChanges = [];
            }

            function _invokeCurrUserScreenSharingStateChangedCb() {
                _invokeCbs(registeredCbToCurrUserScreenSharingStateChange, [currUserScreenSharingState]);
            }

            function _removeCbFromCbArr(cbArr, cb){
                return cbArr.filter(function (iterationCb) {
                    return iterationCb !== cb;
                });
            }

            function _invokeCbs(cbArr, args){
                cbArr.forEach(function(cb){
                    cb.apply(null, args);
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
                if (currUserScreenSharingState !== UserScreenSharingStateEnum.NONE.enum) {
                    var errMsg = 'ScreenSharingSrv: screen sharing is already active!!!';
                    $log.debug(errMsg);
                    return $q.reject(errMsg);
                }

                return ScreenSharingDataGetterSrv.getScreenSharingData(screenSharingDataGuid).then(function (screenSharingData) {
                    screenSharingData.status = ScreenSharingStatusEnum.CONFIRMED.enum;
                    return screenSharingData.$save();
                });
            };

            this.endSharing = function (screenSharingDataGuid) {
                var getDataPromMap = {};
                getDataPromMap.screenSharingData = ScreenSharingDataGetterSrv.getScreenSharingData(screenSharingDataGuid);
                getDataPromMap.currUid = UserProfileService.getCurrUserId();
                getDataPromMap.currUidScreenSharingRequests = ScreenSharingDataGetterSrv.getCurrUserScreenSharingRequests();
                getDataPromMap.storage = _getStorage();
                return $q.all(getDataPromMap).then(function (data) {
                    var dataToSave = {};
                    // update root screen sharing object
                    data.screenSharingData.status = ScreenSharingStatusEnum.ENDED.enum;
                    dataToSave[data.screenSharingData.$$path] = data.screenSharingData;

                    // update viewerActivePath
                    dataToSave[data.screenSharingData.viewerActivePath] = null;
                    // update sharerActivePath
                    dataToSave[data.screenSharingData.sharerActivePath] = null;

                    // update viewerArchivePath
                    var viewerArchiveGuidPath = data.screenSharingData.viewerArchivePath + '/' + data.screenSharingData.guid;
                    dataToSave[viewerArchiveGuidPath] = false;
                    // update sharerArchivePath
                    var sharerArchiveGuidPath = data.screenSharingData.sharerArchivePath + '/' + data.screenSharingData.guid;
                    dataToSave[sharerArchiveGuidPath] = false;

                    return data.storage.update(dataToSave);
                });
            };

            this.registerToActiveScreenSharingDataChanges = function (cb) {
                if (activeScreenSharingDataFromAdapter) {
                    registeredCbToActiveScreenSharingDataChanges.push(cb);
                    cb(activeScreenSharingDataFromAdapter);
                }
            };

            this.unregisterFromActiveScreenSharingDataChanges = function(cb){
                registeredCbToActiveScreenSharingDataChanges =_removeCbFromCbArr(registeredCbToActiveScreenSharingDataChanges, cb);
            };

            this.registerToCurrUserScreenSharingStateChanges = function (cb) {
                registeredCbToCurrUserScreenSharingStateChange.push(cb);
                cb(currUserScreenSharingState);
            };

            this.unregisterFromCurrUserScreenSharingStateChanges = function (cb) {
                registeredCbToCurrUserScreenSharingStateChange = _removeCbFromCbArr(registeredCbToCurrUserScreenSharingStateChange,cb);
            };

            this.getActiveScreenSharingData = function () {
                if (!activeScreenSharingDataFromAdapter) {
                    return $q.when(null);
                }

                var dataPromMap = {
                    screenSharingData: ScreenSharingDataGetterSrv.getScreenSharingData(activeScreenSharingDataFromAdapter.guid),
                    currUid: UserProfileService.getCurrUserId()
                };
                return $q.all(dataPromMap).then(function(dataMap){
                    var orig$saveFn = dataMap.screenSharingData.$save;
                    dataMap.screenSharingData.$save = function () {
                        dataMap.screenSharingData.updatedBy = dataMap.currUid;
                        return orig$saveFn.apply(dataMap.screenSharingData);
                    };

                    return dataMap.screenSharingData;
                });
            };

            this._userScreenSharingStateChanged = function (newUserScreenSharingState, screenSharingData) {
                if (!newUserScreenSharingState || (currUserScreenSharingState === newUserScreenSharingState)) {
                    return;
                }

                currUserScreenSharingState = newUserScreenSharingState;

                var isViewerState = newUserScreenSharingState === UserScreenSharingStateEnum.VIEWER.enum;
                var isSharerState = newUserScreenSharingState === UserScreenSharingStateEnum.SHARER.enum;
                if (isSharerState || isViewerState) {
                    activeScreenSharingDataFromAdapter = screenSharingData;
                    ScreenSharingUiSrv.activateScreenSharing(newUserScreenSharingState).then(function () {
                        _this.endSharing(screenSharingData.guid);
                    });
                } else {
                    _cleanRegisteredCbToActiveScreenSharingData();
                    ScreenSharingUiSrv.endScreenSharing();
                }

                _invokeCurrUserScreenSharingStateChangedCb(currUserScreenSharingState);
            };

            this._screenSharingDataChanged = function (newScreenSharingData) {
                if (!activeScreenSharingDataFromAdapter || activeScreenSharingDataFromAdapter.guid !== newScreenSharingData.guid) {
                    return;
                }

                activeScreenSharingDataFromAdapter = newScreenSharingData;
                _invokeCbs(registeredCbToActiveScreenSharingDataChanges, [activeScreenSharingDataFromAdapter]);
            };
        }
    );
})(angular);
