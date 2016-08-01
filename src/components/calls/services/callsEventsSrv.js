(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').provider('CallsEventsSrv', function () {
        var isEnabled = true;

        this.enabled = function (_isEnabled) {
            isEnabled = _isEnabled;
        };

        this.$get = function (UserProfileService, InfraConfigSrv, StorageSrv, ENV, CallsStatusEnum, CallsUiSrv, $log, $rootScope, $injector, CallsBtnSrv, $q) {
            'ngInject';
            var CallsEventsSrv = {};

            var scopesObj = {};

            var isInitialize = false;

            var callsSrv;

            function updateScopeData(callsData) {
                angular.forEach(scopesObj, function(scope) {
                    scope.callsData = callsData;
                });
            }

            function openOutGoingCall(callsData) {
                scopesObj.caller = $rootScope.$new();
                scopesObj.caller.callsData = callsData;
                CallsUiSrv.showModal(CallsUiSrv.modals.OUTGOING_CALL, scopesObj.caller);
            }

            function getCallsSrv() {
                if (!callsSrv) {
                    callsSrv = $injector.get('CallsSrv');
                }
                return callsSrv;
            }

            function _listenToCallsData(guid) {
                var callsStatusPath = 'calls/' + guid;

                function _cb(callsData) {

                    if (!callsData) {
                        return;
                    }

                    CallsBtnSrv.updateStatusMap(callsData);

                    UserProfileService.getCurrUserId().then(function (currUid) {
                        switch(callsData.status) {
                            case CallsStatusEnum.PENDING_CALL.enum:
                                $log.debug('call pending');
                                if (isCurrentUserInitiatedCall(currUid)) {
                                    // show outgoing call modal
                                    updateScopeData(callsData);
                                } else {
                                    // show incoming call modal with the ACCEPT & DECLINE buttons
                                    scopesObj.reciver = $rootScope.$new();
                                    scopesObj.reciver.callsData = callsData;
                                    CallsUiSrv.showModal(CallsUiSrv.modals.INCOMING_CALL, scopesObj.reciver);
                                }
                                break;
                            case CallsStatusEnum.DECLINE_CALL.enum:
                                $log.debug('call declined');
                                //if (!isCurrentUserInitiatedCall(currUid)) {
                                    updateScopeData(callsData);
                               // }
                                break;
                            case CallsStatusEnum.ACTIVE_CALL.enum:
                                $log.debug('call active');
                                updateScopeData(callsData);
                                if (isCurrentUserInitiatedCall(currUid)) {
                                    // show outgoing call modal WITH the ANSWERED TEXT, wait 2 seconds and close the modal, show the ActiveCallDRV
                                    CallsUiSrv.showActiveCallDrv();
                                } else {
                                    // close the modal, show the ActiveCallDRV
                                    CallsUiSrv.closeModal();
                                    CallsUiSrv.showActiveCallDrv();
                                }
                                break;
                            case CallsStatusEnum.ENDED_CALL.enum:
                                $log.debug('call ended');
                                updateScopeData(callsData);
                                CallsUiSrv.hideActiveCallDrv();
                                // disconnect other user from call
                                getCallsSrv().disconnectCall();
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
                            var prom = $q.when(false);
                            if (!isInitialize && userCallsData) {
                                prom = getCallsSrv().disconnectAllCalls(userCallsData);
                            }
                            prom.then(function (result) {
                                isInitialize = true;
                                if (!result) {
                                    if (userCallsData) {
                                        angular.forEach(userCallsData, function (isActive, guid) {
                                            _listenToCallsData(guid);
                                        });
                                    }
                                }
                            });
                        });
                    });
                });
            }

            CallsEventsSrv.activate = function () {
                if (isEnabled) {
                    _startListening();
                }
            };

            CallsEventsSrv.openOutGoingCall = openOutGoingCall;

            CallsEventsSrv.updateScopeData = updateScopeData;

            return CallsEventsSrv;
        };
    });
})(angular);
