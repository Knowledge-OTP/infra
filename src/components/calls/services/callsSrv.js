(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').service('CallsSrv',
        function (UserProfileService, $q, UtilitySrv, ENV, $log, CallsDataGetterSrv, CallsDataSetterSrv, WebcallSrv, CallsEventsSrv, CallsStatusEnum, CallsActionStatusEnum) {
            'ngInject';

            var isTeacherApp = (ENV.appContext.toLowerCase()) === 'dashboard';//  to lower case was added in order to

            function _handleCallerIdOrReceiverIdUndefined(callsData, methodName) {
                if (angular.isUndefined(callsData.callerId) || angular.isUndefined(callsData.receiverId)) {
                    var errMSg = 'CallsSrv '+ methodName +': callerId or receiverId are missing!';
                    $log.error(errMSg);
                    return $q.reject(errMSg);
                }
                return $q.when(true);
            }

            function _webCallConnect(callId) {
                return WebcallSrv.connect(callId).catch(function(err) {
                    $log.error('Error in _webCallConnect', err);
                    return $q.reject(err);
                });
            }

            function _webCallHang() {
                return WebcallSrv.hang().catch(function(err) {
                    $log.debug('_webCallHang catch', err);
                    return $q.reject(err);
                });
            }

            function _connectCall(userCallData) {
                var newCallGuid = UtilitySrv.general.createGuid();
                $log.debug('new call guid: ' + newCallGuid);
                var getDataPromMap = CallsDataGetterSrv.getDataPromMap(newCallGuid);
                // initial popup pending without cancel option until return from firebase
                var callsData = {
                    status: CallsStatusEnum.PENDING_CALL.enum,
                    callerId: userCallData.callerId,
                    receiverId: userCallData.newReceiverId
                };
                CallsEventsSrv.openOutGoingCall(callsData);
                return _webCallConnect(newCallGuid).then(function () {
                    return $q.all(getDataPromMap).then(function (data) {
                        return CallsDataSetterSrv.setNewConnect(data, userCallData, newCallGuid, isTeacherApp).then(function (callsMap) {
                            var callsData = angular.copy(callsMap['calls/' + newCallGuid]);
                            callsData.isInitialized = true;
                            CallsEventsSrv.updateScopeData(callsData);
                            return callsMap;
                        });
                    });
                });
            }

            function _disconnectCall(userCallData) {
                var receiverId = userCallData.oldReceiverId ? userCallData.oldReceiverId : userCallData.newReceiverId;
                var guid = userCallData.oldCallGuid ? userCallData.oldCallGuid : userCallData.newCallGuid;
                var getDataPromMap = CallsDataGetterSrv.getDataPromMap(guid);
                _webCallHang();
                return $q.all(getDataPromMap).then(function (data) {
                    return CallsDataSetterSrv.setDisconnectCall(data, {
                        receiverId: receiverId
                    }, guid);
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
                _webCallHang();
                var getDataPromMap = CallsDataGetterSrv.getDataPromMap(callsData.guid);
                return $q.all(getDataPromMap).then(function (data) {
                    return CallsDataSetterSrv.setDeclineCall(data, callsData, callsData.guid);
                });
            }

            function _initiateCall(callerId, receiverId) {
                if (angular.isUndefined(callerId) || angular.isUndefined(receiverId)) {
                    var errMSg = 'CallsSrv: callerId or receiverId are missing!';
                    $log.error(errMSg);
                    return $q.reject(errMSg);
                }
                return _isReceiverIsInActiveCall(receiverId, callerId).then(function () {
                    return CallsDataGetterSrv.getUserCallStatus(callerId, receiverId).then(function (userCallData) {
                        var callActionProm;

                        switch (userCallData.action) {
                            case CallsActionStatusEnum.DISCONNECT_ACTION.enum:
                                callActionProm = _disconnectCall(userCallData);
                                break;
                            case CallsActionStatusEnum.CONNECT_ACTION.enum:
                                callActionProm = _connectCall(userCallData);
                                break;
                            case CallsActionStatusEnum.DISCONNECT_AND_CONNECT_ACTION.enum:
                                callActionProm = _disconnectCall(userCallData).then(function () {
                                    return _connectCall(userCallData);
                                });
                                break;
                        }

                        return callActionProm;
                    });
                });
            }

            function _isReceiverIsInActiveCall(receiverId, callerId) {
                return CallsDataGetterSrv.getReceiverCallsData(receiverId, isTeacherApp).then(function(callsDataMap) {
                    var callsDataArr = [];
                    var isInActiveCall = false;
                    angular.forEach(callsDataMap, function(callData) {
                        if(callData.status && (callData.status === CallsStatusEnum.PENDING_CALL.enum ||
                            callData.status === CallsStatusEnum.ACTIVE_CALL.enum) &&
                            !CallsDataGetterSrv.isCallDataHasReceiverIdOrCallerId(callData, receiverId, callerId)) {
                            callsDataArr.push(callData);
                        }
                    });
                    if (callsDataArr.length > 0) {
                        var err = {
                            receiverId: receiverId,
                            errorCode: 3
                        };
                        $log.error('Error in _isReceiverIsInActiveCall', err);
                        isInActiveCall = $q.reject(err);
                    }
                    return isInActiveCall;
                });
            }

            // api
            this.acceptCall = function(callsData) {
                return _handleCallerIdOrReceiverIdUndefined(callsData, 'acceptCall').then(function () {
                    return _acceptCall(callsData);
                }).catch(function(err){
                    $log.error('Error in acceptCall', err);
                    return $q.reject(err);
                });
            };

            this.declineCall = function(callsData) {
                return _handleCallerIdOrReceiverIdUndefined(callsData, 'declineCall').then(function () {
                    return _declineCall(callsData);
                }).catch(function(err){
                    $log.error('Error in declineCall', err);
                    return $q.reject(err);
                });
            };

            this.disconnectCall = function(callsData, useWebCallHangProm) {
                var prom = $q.when();
                if (useWebCallHangProm) {
                    prom = _webCallHang();
                } else {
                    _webCallHang();
                }
                return prom;
            };

            this.disconnectAllCalls = function(userCallsDataMap) {
                var callsMapProm = [];
                angular.forEach(userCallsDataMap, function(isActive, guidKey) {
                    var callProm = CallsDataGetterSrv.getCallsData(guidKey).then(function (callsData) {
                        return _declineCall(callsData, false);
                    });
                    callsMapProm.push(callProm);
                });
                return $q.all(callsMapProm);
            };

            this.callsStateChanged = function (receiverId) {
                return UserProfileService.getCurrUserId().then(function(callerId) {
                    return _initiateCall(callerId, receiverId);
                }).catch(function(err){
                    $log.error('Error in callsStateChanged', err);
                    return $q.reject(err);
                });
            };
        }
    );
})(angular);
