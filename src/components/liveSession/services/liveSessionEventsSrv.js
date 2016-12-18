(function (angular) {
    'use strict';

    angular.module('znk.infra.liveSession').provider('LiveSessionEventsSrv', function () {
        var isEnabled = true;

        this.enabled = function (_isEnabled) {
            isEnabled = _isEnabled;
        };

        this.$get = function (UserProfileService, InfraConfigSrv, $q, StorageSrv, ENV, LiveSessionStatusEnum,
                              UserLiveSessionStateEnum, $log, LiveSessionUiSrv, LiveSessionSrv) {
            'ngInject';

            var LiveSessionEventsSrv = {};

            function _listenToLiveSessionData(guid) {
                var liveSessionDataPath = ENV.firebaseAppScopeName + 'liveSession/' + guid;

                function _cb(liveSessionData) {
                    if (!liveSessionData) {
                        return;
                    }

                    UserProfileService.getCurrUserId().then(function (currUid) {
                        switch (liveSessionData.status) {
                            case LiveSessionStatusEnum.PENDING_STUDENT.enum:
                                if (liveSessionData.studentId !== currUid) {
                                    return;
                                }

                                LiveSessionUiSrv.showStudentLiveSessionPopUp().then(function () {
                                    LiveSessionSrv.confirmLiveSession(liveSessionData.guid);
                                }, function () {
                                    LiveSessionSrv.endSharing(liveSessionData.guid);
                                });
                                break;
                            case LiveSessionStatusEnum.PENDING_EDUCATOR.enum:
                                if (liveSessionData.educatorId !== currUid) {
                                    return;
                                }

                                LiveSessionSrv.confirmLiveSession(liveSessionData.guid);
                                break;
                            case LiveSessionStatusEnum.CONFIRMED.enum:
                                var userLiveSessionState = UserLiveSessionStateEnum.NONE.enum;

                                if (liveSessionData.studentId === currUid) {
                                    userLiveSessionState = UserLiveSessionStateEnum.STUDENT.enum;
                                }

                                if (liveSessionData.educatorId === currUid) {
                                    userLiveSessionState = UserLiveSessionStateEnum.EDUCATOR.enum;
                                }

                                if (userLiveSessionState !== UserLiveSessionStateEnum.NONE.enum) {
                                    LiveSessionSrv._userLiveSessionStateChanged(userLiveSessionState, liveSessionData);
                                }

                                break;
                            case LiveSessionStatusEnum.ENDED.enum:
                                LiveSessionSrv._userLiveSessionStateChanged(UserLiveSessionStateEnum.NONE.enum, liveSessionData);
                                break;
                            default:
                                $log.error('LiveSessionEventsSrv: invalid status was received ' + liveSessionData.status);
                        }

                        LiveSessionsSrv._liveSessionDataChanged(liveSessionData);
                    });
                }

                InfraConfigSrv.getGlobalStorage().then(function (globalStorage) {
                    globalStorage.onEvent(StorageSrv.EVENTS.VALUE, liveSessionDataPath, _cb);
                });
            }

            function _startListening() {
                UserProfileService.getCurrUserId().then(function (currUid) {
                    InfraConfigSrv.getGlobalStorage().then(function (globalStorage) {
                        var appName = ENV.firebaseAppScopeName;
                        var userLiveSessionPath = appName + '/users/' + currUid + '/liveSession/active';
                        globalStorage.onEvent(StorageSrv.EVENTS.VALUE, userLiveSessionPath, function (userLiveSessionGuids) {
                            if (userLiveSessionGuids) {
                                angular.forEach(userLiveSessionGuids, function (isActive, guid) {
                                    if(isActive){
                                        _listenToLiveSessionData(guid);
                                    }
                                });
                            }
                        });
                    });
                });
            }

            LiveSessionEventsSrv.activate = function () {
                if (isEnabled) {
                    _startListening();
                }
            };

            return LiveSessionEventsSrv;
        };
    });
})(angular);
