(function (angular) {
    'use strict';

    angular.module('znk.infra.calls')
        .constant('CALL_UPDATE', 'CallsEventsSrv: call updated')
        .provider('CallsEventsSrv', function () {
            'ngInject';
            var isEnabled = true;

            this.enabled = function (_isEnabled) {
                isEnabled = _isEnabled;
            };

            this.$get = function (UserProfileService, InfraConfigSrv, StorageSrv, ENV, CallsStatusEnum, CallsUiSrv, $log,
                                  $rootScope, $injector, $q, CALL_UPDATE, CallsActionStatusEnum) {
                var registeredCbToCurrUserCallStateChange = [];
                var currUserCallState;

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
                            currUserCallState = callsData;
                            return;
                        }

                        updateScopeData(callsData);

                        $rootScope.$broadcast(CALL_UPDATE, callsData);

                        UserProfileService.getCurrUserId().then(function (currUid) {
                            switch(callsData.status) {
                                case CallsStatusEnum.PENDING_CALL.enum:
                                    $log.debug('call pending');
                                    if (!isCurrentUserInitiatedCall(currUid)) {
                                        // show incoming call modal with the ACCEPT & DECLINE buttons
                                        scopesObj.reciver = $rootScope.$new();
                                        scopesObj.reciver.callsData = callsData;
                                        CallsUiSrv.showModal(CallsUiSrv.modals.INCOMING_CALL, scopesObj.reciver);
                                    }
                                    break;
                                case CallsStatusEnum.DECLINE_CALL.enum:
                                    $log.debug('call declined');
                                    getCallsSrv().disconnectCall();
                                    break;
                                case CallsStatusEnum.ACTIVE_CALL.enum:
                                    $log.debug('call active');
                                    InfraConfigSrv.getGlobalStorage().then(function (globalStorage) {
                                        var callPath = 'calls/' + callsData.guid;
                                        var adapterRef = globalStorage.adapter.getRef(callPath);
                                        adapterRef.onDisconnect().update({
                                            isDisconnect: true
                                        });
                                    });
                                    if (callsData.isDisconnect){
                                        $log.debug('call disconnected');
                                        var userCallData = {
                                            action: CallsActionStatusEnum.DISCONNECT_ACTION.enum,
                                            callerId: callsData.callerId,
                                            newReceiverId: callsData.receiverId,
                                            newCallGuid: callsData.guid
                                        };
                                        getCallsSrv().forceDisconnect(userCallData);
                                    } else if (!isCurrentUserInitiatedCall(currUid)) {
                                        CallsUiSrv.closeModal();
                                        // show outgoing call modal WITH the ANSWERED TEXT, wait 2 seconds and close the modal, show the ActiveCallDRV
                                    } else {
                                        // close the modal, show the ActiveCallDRV
                                        // CallsUiSrv.closeModal();
                                    }
                                    break;
                                case CallsStatusEnum.ENDED_CALL.enum:
                                    $log.debug('call ended');
                                    // disconnect other user from call
                                    getCallsSrv().disconnectCall();
                                    break;
                            }
                            _invokeCbs(registeredCbToCurrUserCallStateChange, [callsData]);
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
                            var userCallsPath = appName + '/users/' + currUid + '/calls/active';
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

                function _invokeCbs(cbArr, args){
                    cbArr.forEach(function(cb){
                        cb.apply(null, args);
                    });
                }

                CallsEventsSrv.activate = function () {
                    if (isEnabled) {
                        _startListening();
                    }
                };

                CallsEventsSrv.openOutGoingCall = openOutGoingCall;

                CallsEventsSrv.updateScopeData = updateScopeData;

                CallsEventsSrv.registerToCurrUserCallStateChanges = function (cb) {
                    if (angular.isFunction(cb)) {
                        registeredCbToCurrUserCallStateChange.push(cb);
                    }
                };

                return CallsEventsSrv;
            };
        });
})(angular);
