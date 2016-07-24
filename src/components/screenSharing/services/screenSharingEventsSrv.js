(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').provider('ScreenSharingEventsSrv', function () {
        var isEnabled = true;

        this.enabled = function (_isEnabled) {
            isEnabled = _isEnabled;
        };

        this.$get = function (UserProfileService, InfraConfigSrv, $q, StorageSrv, ENV, ScreenSharingStatusEnum, UserScreenSharingStateEnum, ScreenSharingSrv, $log, ScreenSharingUiSrv) {
            'ngInject';

            var ScreenSharingEventsSrv = {};

            function _listenToScreenSharingData(guid) {
                var screenSharingStatusPath = 'screenSharing/' + guid;

                function _cb(screenSharingData) {
                    if (!screenSharingData) {
                        return;
                    }

                    UserProfileService.getCurrUserId().then(function (currUid) {
                        switch (screenSharingData.status) {
                            case ScreenSharingStatusEnum.PENDING_VIEWER.enum:
                                if (screenSharingData.viewerId !== currUid) {
                                    return;
                                }

                                ScreenSharingUiSrv.showScreenSharingConfirmationPopUp().then(function () {
                                    ScreenSharingSrv.confirmSharing(screenSharingData.guid);
                                }, function () {
                                    ScreenSharingSrv.endSharing(screenSharingData.guid);
                                });
                                break;
                            case ScreenSharingStatusEnum.PENDING_SHARER.enum:
                                if (screenSharingData.sharerId !== currUid) {
                                    return;
                                }

                                ScreenSharingSrv.confirmSharing(screenSharingData.guid);
                                break;
                            case ScreenSharingStatusEnum.CONFIRMED.enum:
                                UserProfileService.getCurrUserId().then(function (currUid) {
                                    var userScreenSharingState = UserScreenSharingStateEnum.NONE.enum;

                                    if (screenSharingData.viewerId === currUid) {
                                        userScreenSharingState = UserScreenSharingStateEnum.VIEWER.enum;
                                    }

                                    if (screenSharingData.sharerId === currUid) {
                                        userScreenSharingState = UserScreenSharingStateEnum.SHARER.enum;
                                    }

                                    if (userScreenSharingState !== UserScreenSharingStateEnum.NONE.enum) {
                                        ScreenSharingSrv._userScreenSharingStateChanged(userScreenSharingState, screenSharingData);
                                    }
                                });

                                break;
                            case ScreenSharingStatusEnum.ENDED.enum:
                                debugger;
                                // ScreenSharingSrv._userScreenSharingStateChanged(UserScreenSharingStateEnum.NONE.enum, screenSharingData);
                                $log.debug('ScreenSharingEventsSrv: Sharing request was ended ' + screenSharingData.guid);
                                break;
                            default:
                                $log.error('ScreenSharingEventsSrv: invalid status was received ' + screenSharingData.status);

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
                        var userScreenSharingPath = appName + '/users/' + currUid + '/screenSharing';
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
