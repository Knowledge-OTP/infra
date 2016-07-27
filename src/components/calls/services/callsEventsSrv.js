(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').provider('CallsEventsSrv', function () {
        var isEnabled = true;

        this.enabled = function (_isEnabled) {
            isEnabled = _isEnabled;
        };

        this.$get = function (UserProfileService, InfraConfigSrv, StorageSrv, ENV, CallsStatusEnum, CallsUiSrv, $log, CallsSrv, $rootScope) {
            'ngInject';
            var CallsEventsSrv = {};

            var scope;

            function getScopeSingleTon() {
                if (!scope) {
                    scope = $rootScope.$new();
                }
                return scope;
            }

            function _listenToCallsData(guid) {
                var callsStatusPath = 'calls/' + guid;

                function _cb(callsData) {

                    if (!callsData) {
                        return;
                    }

                    var scopeSingleton = getScopeSingleTon();

                    scopeSingleton.callsData = callsData;

                    UserProfileService.getCurrUserId().then(function (currUid) {
                        switch(callsData.status) {
                            case CallsStatusEnum.PENDING_CALL.enum:
                                $log.debug('call pending');
                                if (isCurrentUserInitiatedCall(currUid)) {
                                    // show outgoing call modal
                                    CallsUiSrv.showModal(CallsUiSrv.modals.OUTGOING_CALL, scopeSingleton);
                                } else {
                                    // show incoming call modal with the ACCEPT & DECLINE buttons
                                    CallsUiSrv.showModal(CallsUiSrv.modals.INCOMING_CALL, callsData);
                                }
                                break;
                            case CallsStatusEnum.DECLINE_CALL.enum:
                                $log.debug('call declined');
                                if (isCurrentUserInitiatedCall(currUid)) {
                                    // close outgoing call modal
                                    CallsUiSrv.closeModal();
                                } else {
                                    // show incoming call modal WITH the DECLINED TEXT
                                    CallsUiSrv.showModal(CallsUiSrv.modals.INCOMING_CALL, callsData);
                                }
                                break;
                            case CallsStatusEnum.ACTIVE_CALL.enum:
                                $log.debug('call active');
                                if (isCurrentUserInitiatedCall(currUid)) {
                                    // show outgoing call modal WITH the ANSWERED TEXT, wait 2 seconds and close the modal, show the ActiveCallDRV
                                    CallsUiSrv.showModal(CallsUiSrv.modals.OUTGOING_CALL, callsData);
                                    CallsUiSrv.showActiveCallDrv();
                                } else {
                                    // close the modal, show the ActiveCallDRV
                                    CallsUiSrv.closeModal();
                                    CallsUiSrv.showActiveCallDrv();
                                }
                                break;
                            case CallsStatusEnum.ENDED_CALL.enum:
                                $log.debug('call ended');
                                if (isCurrentUserInitiatedCall(currUid)) {
                                    // hide the ActiveCallDRV
                                } else {
                                    // hide the ActiveCallDRV
                                }
                                CallsUiSrv.hideActiveCallDrv();
                                // disconnect other user from call
                                CallsSrv.disconnectCall();
                                break;
                        }
                    });

                    function isCurrentUserInitiatedCall(currUid) {
                        return (currUid === callsData.callerId);
                    }
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
