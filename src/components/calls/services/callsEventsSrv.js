(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').provider('CallsEventsSrv', function () {
        var isEnabled = true;

        this.enabled = function (_isEnabled) {
            isEnabled = _isEnabled;
        };

        this.$get = function (UserProfileService, InfraConfigSrv, $q, StorageSrv, ENV) {
            'ngInject';
            var CallsEventsSrv = {};

            function _listenToCallsData(guid) {
                var callsStatusPath = 'calls/' + guid;

                function _cb(callsData) {
                    if (!callsData || callsData.status !== CallsStatusEnum.CONFIRMED.enum) {
                        return;
                    }

                    UserProfileService.getCurrUserId().then(function (currUid) {
                        var userCallsState = UserCallsStateEnum.NONE.enum;

                        if (callsData.viewerId === currUid) {
                            userCallsState = UserCallsStateEnum.VIEWER.enum;
                        }

                        if (callsData.sharerId === currUid) {
                            userCallsState = UserCallsStateEnum.SHARER.enum;
                        }

                        if (userCallsState !== UserCallsStateEnum.NONE.enum) {
                            CallsSrv._userCallsStateChanged(userCallsState);
                        }
                    });
                }

                InfraConfigSrv.getGlobalStorage().then(function (globalStorage) {
                    globalStorage.onEvent(StorageSrv.EVENTS.VALUE, callsStatusPath, _cb);
                });
            }

            function _startListening() {
                UserProfileService.getCurrUserId().then(function (currUid) {
                    InfraConfigSrv.getGlobalStorage().then(function (globalStorage) {
                        var appName = ENV.firebaseAppScopeName;
                        var userCallsPath = appName + '/users/' + currUid + '/calls';
                        globalStorage.onEvent(StorageSrv.EVENTS.VALUE, userCallsPath, function (userCallsData) {
                            if (userCallsData) {
                                angular.forEach(userCallsData, function (isActive, guid) {
                                    _listenToCallsData(guid);
                                });
                            }
                        });
                    });
                });
            }

            CallsEventsSrv.activate = function () {
                if (isEnabled) {
                    _startListening();
                }
            };

            return CallsEventsSrv;
        };
    });
})(angular);
