(function (angular) {
    'use strict';

    angular.module('znk.infra.liveSession').service('LiveSessionSrv',
        function (UserProfileService, InfraConfigSrv, $q, UtilitySrv, LiveSessionDataGetterSrv, LiveSessionStatusEnum,
                  ENV, $log, UserLiveSessionStateEnum, LiveSessionUiSrv) {
            'ngInject';

            var _this = this;

            var activeLiveSessionDataFromAdapter = null;
            var currUserLiveSessionState = UserLiveSessionStateEnum.NONE.enum;
            var registeredCbToActiveLiveSessionDataChanges = [];
            var registeredCbToCurrUserLiveSessionStateChange = [];

            var isTeacherApp = (ENV.appContext.toLowerCase()) === 'dashboard';//  to lower case was added in order to

            function _getRoundTime() {
                return Math.floor(Date.now() / 1000) * 1000;
            }

            function _getStorage() {
                return InfraConfigSrv.getGlobalStorage();
            }

            function _getLiveSessionInitStatusByInitiator(initiator) {
                var initiatorToInitStatusMap = {};
                initiatorToInitStatusMap[UserLiveSessionStateEnum.STUDENT.enum] = LiveSessionStatusEnum.PENDING_EDUCATOR.enum;
                initiatorToInitStatusMap[UserLiveSessionStateEnum.EDUCATOR.enum] = LiveSessionStatusEnum.PENDING_STUDENT.enum;

                return initiatorToInitStatusMap[initiator] || null;
            }

            function _isLiveSessionAlreadyInitiated(educatorId, studentId) {
                return LiveSessionDataGetterSrv.getCurrUserLiveSessionData().then(function (liveSessionDataMap) {
                    var isInitiated = false;
                    var liveSessionDataMapKeys = Object.keys(liveSessionDataMap);
                    for (var i in liveSessionDataMapKeys) {
                        var liveSessionDataKey = liveSessionDataMapKeys[i];
                        var liveSessionData = liveSessionDataMap[liveSessionDataKey];

                        var isEnded = liveSessionData.status === LiveSessionStatusEnum.ENDED.enum;
                        if (isEnded) {
                            _this.endLiveSession(liveSessionData.guid);
                            continue;
                        }

                        isInitiated = liveSessionData.educatorId === educatorId && liveSessionData.studentId === studentId;
                        if (isInitiated) {
                            break;
                        }
                    }
                    return isInitiated;
                });
            }

            function _initiateLiveSession(educatorData, studentData, initiator) {
                var errMsg;

                if (angular.isUndefined(studentData.isTeacher) || angular.isUndefined(educatorData.isTeacher)) {
                    errMsg = 'LiveSessionSrv: isTeacher property was not provided!!!';
                    $log.error(errMsg);
                    return $q.reject(errMsg);
                }

                if (currUserLiveSessionState !== UserLiveSessionStateEnum.NONE.enum) {
                    errMsg = 'LiveSessionSrv: live session is already active!!!';
                    $log.debug(errMsg);
                    return $q.reject(errMsg);
                }

                var initLiveSessionStatus = _getLiveSessionInitStatusByInitiator(initiator);
                if (!initLiveSessionStatus) {
                    errMsg = 'LiveSessionSrv: initiator was not provided';
                    $log.error(errMsg);
                    return $q.reject(errMsg);
                }

                return _isLiveSessionAlreadyInitiated(educatorData.uid, studentData.uid).then(function (isInitiated) {
                    if (isInitiated) {
                        var errMsg = 'LiveSessionSrv: live session was already initiated';
                        $log.error(errMsg);
                        return $q.reject(errMsg);
                    }

                    var getDataPromMap = {};

                    getDataPromMap.currUserLiveSessionRequests = LiveSessionDataGetterSrv.getCurrUserLiveSessionRequests();

                    var newLiveSessionGuid = UtilitySrv.general.createGuid();
                    getDataPromMap.newLiveSessionData = LiveSessionDataGetterSrv.getLiveSessionData(newLiveSessionGuid);

                    getDataPromMap.currUid = UserProfileService.getCurrUserId();

                    return $q.all(getDataPromMap).then(function (data) {
                        var dataToSave = {};

                        var startTime = _getRoundTime();
                        var studentPath = LiveSessionDataGetterSrv.getUserLiveSessionRequestsPath(studentData, newLiveSessionGuid);
                        var educatorPath = LiveSessionDataGetterSrv.getUserLiveSessionRequestsPath(educatorData, newLiveSessionGuid);
                        var newLiveSessionData = {
                            guid: newLiveSessionGuid,
                            educatorId: educatorData.uid,
                            studentId: studentData.uid,
                            status: initLiveSessionStatus,
                            studentPath: studentPath,
                            educatorPath: educatorPath,
                            appName: ENV.firebaseAppScopeName.split('_')[0],
                            sessionGUID: UtilitySrv.general.createGuid(),
                            extendTime: 0,
                            startTime: startTime,
                            endTime: null,
                            duration: null,
                            sessionSubject: educatorData.sessionSubject.id
                        };
                        angular.extend(data.newLiveSessionData, newLiveSessionData);

                        dataToSave[data.newLiveSessionData.$$path] = data.newLiveSessionData;
                        //educator live session requests object update
                        data.currUserLiveSessionRequests[newLiveSessionGuid] = true;
                        dataToSave[educatorPath] = data.currUserLiveSessionRequests;
                        //student live session requests object update
                        var studentLiveSessionDataGuidPath = studentPath + '/' + newLiveSessionGuid;
                        dataToSave[studentLiveSessionDataGuidPath] = true;

                        return _getStorage().then(function (StudentStorage) {
                            return StudentStorage.update(dataToSave);
                        });
                    });

                });
            }

            function _cleanRegisteredCbToActiveLiveSessionData() {
                activeLiveSessionDataFromAdapter = null;
                registeredCbToActiveLiveSessionDataChanges = [];
            }

            function _invokeCurrUserLiveSessionStateChangedCb() {
                _invokeCbs(registeredCbToCurrUserLiveSessionStateChange, [currUserLiveSessionState]);
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

            this.startLiveSession = function (studentData, sessionSubject) {
                return UserProfileService.getCurrUserId().then(function (currUserId) {
                    var educatorData = {
                        uid: currUserId,
                        isTeacher: isTeacherApp,
                        sessionSubject: sessionSubject
                    };
                    return _initiateLiveSession(educatorData, studentData, UserLiveSessionStateEnum.EDUCATOR.enum);
                });
            };

            // this.viewOtherUserScreen = function (sharerData) {
            //     return UserProfileService.getCurrUserId().then(function (currUserId) {
            //         var viewerData = {
            //             uid: currUserId,
            //             isTeacher: isTeacherApp
            //         };
            //         return _initiateLiveSession(sharerData, viewerData, UserLiveSessionStateEnum.VIEWER.enum);
            //     });
            // };

            this.confirmLiveSession = function (liveSessionGuid) {
                if (currUserLiveSessionState !== UserLiveSessionStateEnum.NONE.enum) {
                    var errMsg = 'LiveSessionSrv: live session is already active!!!';
                    $log.debug(errMsg);
                    return $q.reject(errMsg);
                }

                return LiveSessionDataGetterSrv.getLiveSessionData(liveSessionGuid).then(function (liveSessionData) {
                    liveSessionData.status = LiveSessionStatusEnum.CONFIRMED.enum;
                    return liveSessionData.$save();
                });
            };

            this.endLiveSession = function (liveSessionGuid) {
                var getDataPromMap = {};
                getDataPromMap.liveSessionData = LiveSessionDataGetterSrv.getLiveSessionData(liveSessionGuid);
                getDataPromMap.currUid = UserProfileService.getCurrUserId();
                getDataPromMap.currUidLiveSessionRequests = LiveSessionDataGetterSrv.getCurrUserLiveSessionRequests();
                getDataPromMap.storage = _getStorage();
                return $q.all(getDataPromMap).then(function (data) {
                    var dataToSave = {};

                    data.liveSessionData.status = LiveSessionStatusEnum.ENDED.enum;
                    dataToSave [data.liveSessionData.$$path] = data.liveSessionData;

                    data.currUidLiveSessionRequests[data.liveSessionData.guid] = false;
                    dataToSave[data.currUidLiveSessionRequests.$$path] = data.currUidLiveSessionRequests;

                    var otherUserLiveSessionRequestPath;
                    if (data.liveSessionData.viewerId !== data.currUid) {
                        otherUserLiveSessionRequestPath = data.liveSessionData.studentPath;
                    } else {
                        otherUserLiveSessionRequestPath = data.liveSessionData.teacherPath;
                    }
                    otherUserLiveSessionRequestPath += '/' + data.liveSessionData.guid;
                    dataToSave[otherUserLiveSessionRequestPath] = false;

                    return data.storage.update(dataToSave);
                });
            };

            this.registerToActiveLiveSessionDataChanges = function (cb) {
                if (activeLiveSessionDataFromAdapter) {
                    registeredCbToActiveLiveSessionDataChanges.push(cb);
                    cb(activeLiveSessionDataFromAdapter);
                }
            };

            this.unregisterFromActiveLiveSessionDataChanges = function(cb){
                registeredCbToActiveLiveSessionDataChanges =_removeCbFromCbArr(registeredCbToActiveLiveSessionDataChanges, cb);
            };

            this.registerToCurrUserLiveSessionStateChanges = function (cb) {
                registeredCbToCurrUserLiveSessionStateChange.push(cb);
                cb(currUserLiveSessionState);
            };

            this.unregisterFromCurrUserLiveSessionStateChanges = function (cb) {
                registeredCbToCurrUserLiveSessionStateChange = _removeCbFromCbArr(registeredCbToCurrUserLiveSessionStateChange,cb);
            };

            this.getActiveLiveSessionData = function () {
                if (!activeLiveSessionDataFromAdapter) {
                    return $q.when(null);
                }

                var dataPromMap = {
                    liveSessionData: LiveSessionDataGetterSrv.getLiveSessionData(activeLiveSessionDataFromAdapter.guid),
                    currUid: UserProfileService.getCurrUserId()
                };
                return $q.all(dataPromMap).then(function(dataMap){
                    var orig$saveFn = dataMap.liveSessionData.$save;
                    dataMap.liveSessionData.$save = function () {
                        dataMap.liveSessionData.updatedBy = dataMap.currUid;
                        return orig$saveFn.apply(dataMap.liveSessionData);
                    };

                    return dataMap.liveSessionData;
                });
            };

            this._userLiveSessionStateChanged = function (newUserLiveSessionState, liveSessionData) {
                if (!newUserLiveSessionState || (currUserLiveSessionState === newUserLiveSessionState)) {
                    return;
                }

                currUserLiveSessionState = newUserLiveSessionState;

                var isStudentState = newUserLiveSessionState === UserLiveSessionStateEnum.STUDENT.enum;
                var isEducatorState = newUserLiveSessionState === UserLiveSessionStateEnum.EDUCATOR.enum;
                if (isStudentState || isEducatorState) {
                    activeLiveSessionDataFromAdapter = liveSessionData;
                    LiveSessionUiSrv.activateLiveSession(newUserLiveSessionState).then(function () {
                        _this.endLiveSession(liveSessionData.guid);
                    });
                } else {
                    _cleanRegisteredCbToActiveLiveSessionData();
                    LiveSessionUiSrv.endLiveSession();
                }

                _invokeCurrUserLiveSessionStateChangedCb(currUserLiveSessionState);
            };

            this._liveSessionDataChanged = function (newLiveSessionData) {
                if (!activeLiveSessionDataFromAdapter || activeLiveSessionDataFromAdapter.guid !== newLiveSessionData.guid) {
                    return;
                }

                activeLiveSessionDataFromAdapter = newLiveSessionData;
                _invokeCbs(registeredCbToActiveLiveSessionDataChanges, [activeLiveSessionDataFromAdapter]);
            };
        }
    );
})(angular);
