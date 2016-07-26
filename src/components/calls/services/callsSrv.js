(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').service('CallsSrv',
        function (UserProfileService, $q, UtilitySrv, ENV, $log, CallsDataGetterSrv, InfraConfigSrv, CallsStatusEnum, WebcallSrv) {
            'ngInject';

            var isTeacherApp = (ENV.appContext.toLowerCase()) === 'dashboard';//  to lower case was added in order to

            function _getStorage() {
                return InfraConfigSrv.getGlobalStorage();
            }

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

            function _connectCall(userCallData) {
                var getDataPromMap = {};

                getDataPromMap.currUserCallsRequests = CallsDataGetterSrv.getCurrUserCallsRequests();

                var newCallGuid = UtilitySrv.general.createGuid();
                getDataPromMap.newCallData = CallsDataGetterSrv.getCallsData(newCallGuid);

                getDataPromMap.currUid = UserProfileService.getCurrUserId();

                return WebcallSrv.connect(newCallGuid).then(function () {

                    return $q.all(getDataPromMap).then(function (data) {
                        var dataToSave = {};

                        var isCallerTeacher = userCallData.callerId === data.currUid && isTeacherApp;

                        var receiverPath = CallsDataGetterSrv.getCallsRequestsPath(userCallData.newReceiverId, !isCallerTeacher);
                        var callerPath = CallsDataGetterSrv.getCallsRequestsPath(userCallData.callerId, isCallerTeacher);

                        var newCallData = {
                            guid: newCallGuid,
                            callerId: userCallData.callerId,
                            receiverId: userCallData.newReceiverId,
                            status: CallsStatusEnum.PENDING_CALL.enum,
                            callerPath: callerPath,
                            receiverPath: receiverPath
                        };

                        angular.extend(data.newCallData, newCallData);

                        dataToSave[data.newCallData.$$path] = data.newCallData;
                        //current user call requests object update
                        data.currUserCallsRequests[newCallGuid] = true;
                        dataToSave[data.currUserCallsRequests.$$path] = data.currUserCallsRequests;
                        //other user call requests object update
                        var otherUserCallPath = userCallData.newReceiverId === data.currUid ? callerPath : receiverPath;
                        var otherUserCallDataGuidPath = otherUserCallPath + '/' + newCallGuid;
                        dataToSave[otherUserCallDataGuidPath] = true;

                        return _getStorage().then(function (StudentStorage) {
                            return StudentStorage.update(dataToSave);
                        });
                    });
                });
            }

            function _disconnectCall(userCallData) {

                var receiverId = userCallData.oldReceiverId ? userCallData.oldReceiverId : userCallData.newReceiverId;
                var guid = userCallData.oldCallGuid ? userCallData.oldCallGuid : userCallData.newCallGuid;

                var getDataPromMap = {};

                getDataPromMap.currUserCallsRequests = CallsDataGetterSrv.getCurrUserCallsRequests();
                getDataPromMap.currCallData = CallsDataGetterSrv.getCallsData(guid);
                getDataPromMap.currUid = UserProfileService.getCurrUserId();

                return WebcallSrv.hang().then(function () {
                    return $q.all(getDataPromMap).then(function (data) {
                        var dataToSave = {};
                        data.currCallData.status = CallsStatusEnum.ENDED_CALL.enum;
                        dataToSave[data.currCallData.$$path] = data.currCallData;
                        //current user call requests object update
                        data.currUserCallsRequests[guid] = null;
                        dataToSave[data.currUserCallsRequests.$$path] = data.currUserCallsRequests;
                        //other user call requests object update
                        var otherUserCallPath = receiverId === data.currUid ? data.currCallData.callerPath : data.currCallData.receiverPath;
                        var otherUserCallDataGuidPath = otherUserCallPath + '/' + guid;
                        dataToSave[otherUserCallDataGuidPath] = null;

                        return _getStorage().then(function (StudentStorage) {
                            return StudentStorage.update(dataToSave);
                        });
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
                    if (!userCallData) {
                        var errMsg = 'CallsSrv _initiateCall: userCallStatus is required!';
                        $log.error(errMsg);
                        return $q.reject(errMsg);
                    }

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

            this.callsStateChanged = function (receiverId) {
                return UserProfileService.getCurrUserId().then(function(callerId) {
                    return _initiateCall(callerId, receiverId);
                });
            };
        }
    );
})(angular);
