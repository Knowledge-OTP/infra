(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').service('CallsSrv',
        function (UserProfileService, $q, UtilitySrv, ENV, $log, CallsDataGetterSrv, CallsDataSetterSrv, WebcallSrv) {
            'ngInject';

            var CALL_ACTIONS = {
               DISCONNECT: 'disconnect',
               CONNECT: 'connect',
               DISCONNECT_AND_CONNECT: 'disconnect and connect'
            };

            function _isNewReceiverIdMatchActiveReceiverId(callsData, callerId, receiverId) {
                return callsData.callerId === callerId && callsData.receiverId === receiverId;
            }

            function _isNewReceiverIdNotMatchActiveReceiverId(callsData, callerId, receiverId) {
                return callsData.callerId === callerId && callsData.receiverId !== receiverId;
            }

            function _getUserCallStatus(callerId, receiverId) {
                return CallsDataGetterSrv.getCurrUserCallsData().then(function (callsDataMap) {
                    var userCallData = false;
                    var callsDataMapKeys = Object.keys(callsDataMap);
                    for (var i in callsDataMapKeys) {
                        if (callsDataMapKeys.hasOwnProperty(i)) {
                            var callsDataKey = callsDataMapKeys[i];
                            var callsData = callsDataMap[callsDataKey];
                            /* if user active, and new call init has same receiverId then disconnect */
                            if (_isNewReceiverIdMatchActiveReceiverId(callsData, callerId, receiverId)) {
                                userCallData = {
                                    action: CALL_ACTIONS.DISCONNECT,
                                    callerId: callerId,
                                    newReceiverId: receiverId,
                                    newCallGuid: callsData.guid
                                };
                            /* if user is active with receiverId and new call init with other
                               receiverId then disconnect from current receiverId and connect with new receiverId */
                            } else if (_isNewReceiverIdNotMatchActiveReceiverId(callsData, callerId, receiverId)) {
                                userCallData = {
                                    action: CALL_ACTIONS.DISCONNECT_AND_CONNECT,
                                    callerId: callerId,
                                    newReceiverId: receiverId,
                                    oldReceiverId: callsData.receiverId,
                                    oldCallGuid: callsData.guid
                                };
                            }
                            if (userCallData) {
                                break;
                            }
                        }
                    }
                    if (!userCallData) {
                        /* if user not active, and call init then active user */
                        userCallData = {
                            action: CALL_ACTIONS.CONNECT,
                            callerId: callerId,
                            newReceiverId: receiverId
                        };
                    }
                    return userCallData;
                });
            }

            function _getDataPromMap(guid) {
                var getDataPromMap = {};
                getDataPromMap.currUserCallsRequests = CallsDataGetterSrv.getCurrUserCallsRequests();
                getDataPromMap.currCallData = CallsDataGetterSrv.getCallsData(guid);
                getDataPromMap.currUid = UserProfileService.getCurrUserId();
                return getDataPromMap;
            }

            function _handleCallerIdOrReceiverIdUndefined(callsData, methodName) {
                if (angular.isUndefined(callsData.callerId) || angular.isUndefined(callsData.receiverId)) {
                    var errMSg = 'CallsSrv '+ methodName +': callerId or receiverId are missing!';
                    $log.error(errMSg);
                    return $q.reject(errMSg);
                }
                return $q.when(true);
            }

            function _webCallConnect(callId) {
                return WebcallSrv.connect(callId);
            }

            function _webCallHang() {
                return WebcallSrv.hang();
            }

            function _connectCall(userCallData) {
                var newCallGuid = UtilitySrv.general.createGuid();
                var getDataPromMap = _getDataPromMap(newCallGuid);
                return _webCallConnect(newCallGuid).then(function () {
                    return $q.all(getDataPromMap).then(function (data) {
                         return CallsDataSetterSrv.setNewConnect(data, userCallData, newCallGuid);
                    });
                });
            }

            function _disconnectCall(userCallData) {
                var receiverId = userCallData.oldReceiverId ? userCallData.oldReceiverId : userCallData.newReceiverId;
                var guid = userCallData.oldCallGuid ? userCallData.oldCallGuid : userCallData.newCallGuid;
                var getDataPromMap = _getDataPromMap(guid);
                return _webCallHang().then(function () {
                    return $q.all(getDataPromMap).then(function (data) {
                        return CallsDataSetterSrv.setDisconnectCall(data, {
                            receiverId: receiverId
                        }, guid);
                    });
                });
            }

            function _acceptCall(callsData) {
                return _webCallConnect(callsData.guid).then(function() {
                    return CallsDataGetterSrv.getCallsData(callsData.guid).then(function (currCallData) {
                         return CallsDataSetterSrv.setAcceptCall(currCallData);
                    });
                });
            }

            function _declineCall(callsData) {
                return _webCallHang().then(function () {
                    var getDataPromMap = _getDataPromMap(callsData.guid);
                    return $q.all(getDataPromMap).then(function (data) {
                       return CallsDataSetterSrv.setDeclineCall(data, callsData, callsData.guid);
                    });
                });
            }

            function _initiateCall(callerId, receiverId) {
                if (angular.isUndefined(callerId) || angular.isUndefined(receiverId)) {
                    var errMSg = 'CallsSrv: callerId or receiverId are missing!';
                    $log.error(errMSg);
                    return $q.reject(errMSg);
                }
                return _getUserCallStatus(callerId, receiverId).then(function (userCallData) {
                    var callActionProm;

                    switch (userCallData.action) {
                        case CALL_ACTIONS.DISCONNECT:
                            callActionProm = _disconnectCall(userCallData);
                            break;
                        case CALL_ACTIONS.CONNECT:
                            callActionProm = _connectCall(userCallData);
                            break;
                        case CALL_ACTIONS.DISCONNECT_AND_CONNECT:
                            callActionProm = _disconnectCall(userCallData).then(function () {
                                return _connectCall(userCallData);
                            });
                            break;
                    }

                    return callActionProm;
                });
            }

            // api
            this.acceptCall = function(callsData) {
                return _handleCallerIdOrReceiverIdUndefined(callsData, 'acceptCall').then(function () {
                    return _acceptCall(callsData);
                });
            };

            this.declineCall = function(callsData) {
                return _handleCallerIdOrReceiverIdUndefined(callsData, 'declineCall').then(function () {
                    return _declineCall(callsData);
                });
            };
            /* used to disconnect the other user from web call */
            this.disconnectCall = function() {
                return _webCallHang();
            };

            this.callsStateChanged = function (receiverId) {
                return UserProfileService.getCurrUserId().then(function(callerId) {
                    return _initiateCall(callerId, receiverId);
                });
            };
        }
    );
})(angular);
