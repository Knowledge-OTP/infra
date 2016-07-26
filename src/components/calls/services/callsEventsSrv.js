(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').provider('CallsEventsSrv', function () {
        var isEnabled = true;

        this.enabled = function (_isEnabled) {
            isEnabled = _isEnabled;
        };

        this.$get = function (UserProfileService, InfraConfigSrv, $q, StorageSrv, ENV, CallsStatusEnum, CallsUiSrv, $log) {
            'ngInject';
            var CallsEventsSrv = {};

            function _listenToCallsData(guid) {
                var callsStatusPath = 'calls/' + guid;

                function _cb(callsData) {

                    if (!callsData) {
                        return;
                    }

                    UserProfileService.getCurrUserId().then(function (currUid) {
                        console.log('CallStatusEnum', CallsStatusEnum);
                        console.log('callsData', callsData);

                        switch(callsData.status) {
                            case CallsStatusEnum.PENDING_CALL.enum:
                                $log.debug('call pending');
                                if (isCurrentUserInitiatedCall(currUid)) {
                                    // show outgoing call modal
                                    CallsUiSrv.showModal(CallsUiSrv.modals.OUTGOING_CALL, callsData);
                                } else {
                                    // show incoming call modal with the ACCEPT & DECLINE buttons
                                    CallsUiSrv.showModal(CallsUiSrv.modals.INCOMING_CALL, callsData);
                                }
                                break;
                            case CallsStatusEnum.DECLINE_CALL.enum:
                                $log.debug('call declined');
                                if (isCurrentUserInitiatedCall(currUid)) {
                                    // show outgoing call modal WITH the DECLINED TEXT
                                    CallsUiSrv.showModal(CallsUiSrv.modals.OUTGOING_CALL, callsData);
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
                                break;
                        }


                        /**
                         * Scenarios:
                         * Call is pending, user initiated call
                         * Call is pending, user receives call
                         * Call declined, user initiated call
                         * Call declined, user receives call
                         * Call is Active,  user initiated call
                         * Call is Active,  user receives call
                         * Call ended, user initiated call
                         * Call ended, user received call
                         */

                        // ['PENDING_CALL', 1, 'pending call'],
                        // ['DECLINE_CALL', 2, 'decline call'],
                        // ['ACTIVE_CALL', 3, 'active call'],
                        // ['ENDED_CALL', 4, 'ended call']


                        // var userCallState = UserCallStateEnum.NONE.enum;
                        //
                        // if (callsData.viewerId === currUid) {
                        //     userCallState = UserCallStateEnum.VIEWER.enum;
                        // }
                        //
                        // if (callsData.sharerId === currUid) {
                        //     userCallState = UserCallStateEnum.SHARER.enum;
                        // }
                        //
                        // if (userCallState !== UserCallStateEnum.NONE.enum) {
                        //     CallsSrv._userCallStateChanged(userCallState);
                        // }
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
