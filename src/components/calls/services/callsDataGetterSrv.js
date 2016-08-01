(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').service('CallsDataGetterSrv',
        function (InfraConfigSrv, $q, ENV, UserProfileService, $log, CallsActionStatusEnum) {
            'ngInject';

            var self = this;

            function _getStorage() {
                return InfraConfigSrv.getGlobalStorage();
            }

            function _isNewReceiverIdMatchActiveReceiverId(callsData, callerId, receiverId) {
                return callsData.callerId === callerId && callsData.receiverId === receiverId;
            }

            function _isNewReceiverIdMatchActiveCallerId(callsData, callerId, receiverId) {
                return callsData.receiverId === callerId && callsData.callerId === receiverId;
            }

            function _isNewReceiverIdNotMatchActiveReceiverId(callsData, callerId, receiverId) {
                return callsData.callerId === callerId && callsData.receiverId !== receiverId;
            }

            function _isNewReceiverIdNotMatchActiveCallerId(callsData, callerId, receiverId) {
                return callsData.receiverId === callerId && callsData.callerId !== receiverId;
            }

            this.getCallsDataPath = function (guid) {
                var SCREEN_SHARING_ROOT_PATH = 'calls';
                return SCREEN_SHARING_ROOT_PATH + '/' + guid;
            };

            this.getCallsRequestsPath  = function (uid, isTeacher) {
                var appName = isTeacher ? ENV.dashboardAppName : ENV.studentAppName;
                var USER_DATA_PATH = appName  + '/users/' + uid;
                return USER_DATA_PATH + '/calls';
            };

            this.getCallsData = function (callsGuid) {
                var callsDataPath = this.getCallsDataPath(callsGuid);
                return _getStorage().then(function (storage) {
                    return storage.getAndBindToServer(callsDataPath);
                }).catch(function(err){
                    $log.error('Error in _getStorage', err);
                    return $q.reject(err);
                });
            };

            this.getCurrUserCallsRequests = function(){
                return UserProfileService.getCurrUserId().then(function(currUid){
                    return _getStorage().then(function(storage){
                        var currUserCallsDataPath = ENV.firebaseAppScopeName + '/users/' + currUid + '/calls';
                        return storage.get(currUserCallsDataPath);
                    }).catch(function(err){
                        $log.error('Error in _getStorage', err);
                        return $q.reject(err);
                    });
                }).catch(function(err){
                    $log.error('Error in UserProfileService.getCurrUserId', err);
                    return $q.reject(err);
                });
            };

            this.getCurrUserCallsData = function () {
                var self = this;
                return this.getCurrUserCallsRequests().then(function(currUserCallsRequests){
                    var callsDataPromMap = {};
                    angular.forEach(currUserCallsRequests, function(isActive, guid){
                        if(isActive) {
                            callsDataPromMap[guid] = self.getCallsData(guid);
                        }
                    });

                    return $q.all(callsDataPromMap);
                });
            };

            this.getUserCallStatus = function(callerId, receiverId) {
                return self.getCurrUserCallsData().then(function (callsDataMap) {
                    var userCallData = false;
                    var callsDataMapKeys = Object.keys(callsDataMap);
                    for (var i in callsDataMapKeys) {
                        if (callsDataMapKeys.hasOwnProperty(i)) {
                            var callsDataKey = callsDataMapKeys[i];
                            var callsData = callsDataMap[callsDataKey];

                            switch(true) {
                                /* if user that calls active, and new call init has same receiverId then disconnect */
                                case _isNewReceiverIdMatchActiveReceiverId(callsData, callerId, receiverId):
                                    userCallData = {
                                        action: CallsActionStatusEnum.DISCONNECT_ACTION.enum,
                                        callerId: callerId,
                                        newReceiverId: receiverId,
                                        newCallGuid: callsData.guid
                                    };
                                    break;
                                /* if user that receive call active, and new call init has same callerId then disconnect */
                                case _isNewReceiverIdMatchActiveCallerId(callsData, callerId, receiverId):
                                    userCallData = {
                                        action: CallsActionStatusEnum.DISCONNECT_ACTION.enum,
                                        callerId: receiverId,
                                        newReceiverId: callerId,
                                        newCallGuid: callsData.guid
                                    };
                                    break;
                                /* if user that calls is active with receiverId and new call init with other
                                 receiverId then disconnect from current receiverId and connect with new receiverId */
                                case _isNewReceiverIdNotMatchActiveReceiverId(callsData, callerId, receiverId):
                                    userCallData = {
                                        action: CallsActionStatusEnum.DISCONNECT_AND_CONNECT_ACTION.enum,
                                        callerId: callerId,
                                        newReceiverId: receiverId,
                                        oldReceiverId: callsData.receiverId,
                                        oldCallGuid: callsData.guid
                                    };
                                    break;
                                /* if user that receive calls is active with callerIdId and new call init with other
                                 receiverId then disconnect from current callerId and connect with new receiverId */
                                case _isNewReceiverIdNotMatchActiveCallerId(callsData, callerId, receiverId):
                                    userCallData = {
                                        action: CallsActionStatusEnum.DISCONNECT_AND_CONNECT_ACTION.enum,
                                        callerId: receiverId,
                                        newReceiverId: callerId,
                                        oldReceiverId: callsData.callerId,
                                        oldCallGuid: callsData.guid
                                    };
                                    break;

                            }
                            if (userCallData) {
                                break;
                            }
                        }
                    }
                    if (!userCallData) {
                        /* if user not active, and call init then active user */
                        userCallData = {
                            action: CallsActionStatusEnum.CONNECT_ACTION.enum,
                            callerId: callerId,
                            newReceiverId: receiverId
                        };
                    }
                    return userCallData;
                });
            };

            this.getDataPromMap = function(guid) {
                var getDataPromMap = {};
                getDataPromMap.currUserCallsRequests = self.getCurrUserCallsRequests();
                getDataPromMap.currCallData = self.getCallsData(guid);
                getDataPromMap.currUid = UserProfileService.getCurrUserId();
                return getDataPromMap;
            };
        }
    );
})(angular);
