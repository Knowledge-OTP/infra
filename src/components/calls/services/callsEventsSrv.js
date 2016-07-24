(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').provider('CallsEventsSrv', function () {
        var isEnabled = true;

        this.enabled = function (_isEnabled) {
            isEnabled = _isEnabled;
        };

        this.$get = function (UserProfileService, InfraConfigSrv, $q, StorageSrv, ENV, ScreenSharingStatusEnum, UserScreenSharingStateEnum, ScreenSharingSrv) {
            'ngInject';

            var ScreenSharingEventsSrv = {};

            function _listenToScreenSharingData(guid) {
                var screenSharingStatusPath = 'calls/' + guid;

                function _cb(screenSharingData) {
                    if (!screenSharingData || screenSharingData.status !== ScreenSharingStatusEnum.CONFIRMED.enum) {
                        return;
                    }

                    UserProfileService.getCurrUserId().then(function (currUid) {
                        var userScreenSharingState = UserScreenSharingStateEnum.NONE.enum;

                        if (screenSharingData.viewerId === currUid) {
                            userScreenSharingState = UserScreenSharingStateEnum.VIEWER.enum;
                        }

                        if (screenSharingData.sharerId === currUid) {
                            userScreenSharingState = UserScreenSharingStateEnum.SHARER.enum;
                        }

                        if (userScreenSharingState !== UserScreenSharingStateEnum.NONE.enum) {
                            ScreenSharingSrv._userScreenSharingStateChanged(userScreenSharingState);
                        }
                    });
                }

                InfraConfigSrv.getGlobalStorage().then(function (globalStorage) {
                    globalStorage.onEvent(StorageSrv.EVENTS.VALUE, screenSharingStatusPath, _cb);
                });
            }

            function _startListening() {
                UserProfileService.getCurrUserId().then(function (currUid) {
                    InfraConfigSrv.getGlobalStorage().then(function (globalStorage) {
                        var appName = ENV.firebaseAppScopeName;
                        var userScreenSharingPath = appName + '/users/' + currUid + '/calls';
                        globalStorage.onEvent(StorageSrv.EVENTS.VALUE, userScreenSharingPath, function (userScreenSharingData) {
                            if (userScreenSharingData) {
                                angular.forEach(userScreenSharingData, function (isActive, guid) {
                                    _listenToScreenSharingData(guid);
                                });
                            }
                        });
                    });
                });
            }

            ScreenSharingEventsSrv.activate = function () {
                if (isEnabled) {
                    _startListening();
                }
            };

            return ScreenSharingEventsSrv;
        };
    });
})(angular);
