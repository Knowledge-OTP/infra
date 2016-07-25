(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').service('CallsSrv',
        function (UserProfileService, $q, UtilitySrv, ENV, $log, CallsDataGetterSrv, InfraConfigSrv, CallsStatusEnum) {
            'ngInject';

            var isTeacherApp = (ENV.appContext.toLowerCase()) === 'dashboard';//  to lower case was added in order to

            function _getStorage() {
                return InfraConfigSrv.getGlobalStorage();
            }

            var CALL_ACTIONS = {
               DISCONNECT: 'disconnect', // if user active, and new call init has same receiverId then disconnect
               CONNECT: 'connect',  // if user not active, and call init then active user
               DISCONNECT_AND_CONNECT: 'disconnect and connect' /* if user is active with receiverId and new call init with other
                 receiverId then disconnect from current receiverId and connect with new receiverId */
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

                            if (_isNewReceiverIdMatchActiveReceiverId(callsData, callerId, receiverId)) {
                                userCallData = {
                                    action: CALL_ACTIONS.DISCONNECT,
                                    newReceiverId: receiverId
                                }
                            } else if (_isNewReceiverIdNotMatchActiveReceiverId(callsData, callerId, receiverId)) {
                                userCallData = {
                                    action: CALL_ACTIONS.DISCONNECT_AND_CONNECT,
                                    newReceiverId: receiverId,
                                    oldReceiverId: callsData.receiverId
                                }
                            }

                            if (userCallData) {
                                break;
                            }
                        }
                    }

                    if (!userCallData) {
                        userCallData = {
                            action: CALL_ACTIONS.CONNECT,
                            newReceiverId: receiverId
                        };
                    }

                    return userCallData;
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

                    switch (userCallData.status) {
                        case CALL_ACTIONS.DISCONNECT:
                            break;
                        case CALL_ACTIONS.CONNECT:
                            break;
                        case CALL_ACTIONS.DISCONNECT_AND_CONNECT:
                            break;
                    }


                    var getDataPromMap = {};

                    getDataPromMap.currUserCallsRequests = CallsDataGetterSrv.getCurrUserCallsRequests();

                    var newCallGuid = UtilitySrv.general.createGuid();
                    getDataPromMap.newCallData = CallsDataGetterSrv.getCallsData(newCallGuid);

                    getDataPromMap.currUid = UserProfileService.getCurrUserId();

                    return $q.all(getDataPromMap).then(function (data) {
                        var dataToSave = {};

                        var receiverPath = CallsDataGetterSrv.getCallsRequestsPath(receiverId, isTeacherApp);
                        var callerPath = CallsDataGetterSrv.getCallsRequestsPath(callerId, isTeacherApp);

                        var newCallData = {
                            guid: newCallGuid,
                            callerId: callerId,
                            receiverId: receiverId,
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
                        var otherUserCallPath = receiverId === data.currUid ? callerPath : receiverPath;
                        var otherUserCallDataGuidPath = otherUserCallPath + '/' + newCallGuid;
                        dataToSave[otherUserCallDataGuidPath] = true;

                        return _getStorage().then(function (StudentStorage) {
                            return StudentStorage.update(dataToSave);
                        });
                    });

                });
            }
            //
            //this.shareMyScreen = function (viewerData) {
            //    return UserProfileService.getCurrUserId().then(function (currUserId) {
            //        var sharerData = {
            //            uid: currUserId,
            //            isTeacher: isTeacherApp
            //        };
            //        return _initiateScreenSharing(sharerData, viewerData, UserScreenSharingStateEnum.SHARER.enum);
            //    });
            //};
            //
            //this.viewOtherUserScreen = function (sharerData) {
            //    return UserProfileService.getCurrUserId().then(function (currUserId) {
            //        var viewerData = {
            //            uid: currUserId,
            //            isTeacher: isTeacherApp
            //        };
            //        return _initiateScreenSharing(sharerData, viewerData, UserScreenSharingStateEnum.VIEWER.enum);
            //    });
            //};
            //
            //this.confirmSharing = function (screenSharingDataGuid) {
            //    return ScreenSharingDataGetterSrv.getScreenSharingData(screenSharingDataGuid).then(function (screenSharingData) {
            //        screenSharingData.status = ScreenSharingStatusEnum.CONFIRMED.enum;
            //        return screenSharingData.$save();
            //    });
            //};
            //
            //this.endSharing = function (screenSharingDataGuid) {
            //    var getDataPromMap = {};
            //    getDataPromMap.screenSharingData = ScreenSharingDataGetterSrv.getScreenSharingData(screenSharingDataGuid);
            //    getDataPromMap.currUid = UserProfileService.getCurrUserId();
            //    getDataPromMap.currUidScreenSharingRequests = ScreenSharingDataGetterSrv.getCurrUserScreenSharingRequests();
            //    getDataPromMap.storage = _getStorage();
            //    return $q.all(getDataPromMap).then(function (data) {
            //        var dataToSave = {};
            //
            //        data.screenSharingData.status = ScreenSharingStatusEnum.ENDED.enum;
            //        dataToSave [data.screenSharingData.$$path] = data.screenSharingData;
            //
            //        data.currUidScreenSharingRequests[data.screenSharingData.guid] = false;
            //        dataToSave[data.currUidScreenSharingRequests.$$path] = data.currUidScreenSharingRequests;
            //
            //        var otherUserScreenSharingRequestPath;
            //        if(data.screenSharingData.viewerId !== data.currUid){
            //            otherUserScreenSharingRequestPath = data.screenSharingData.viewerPath;
            //        }else{
            //            otherUserScreenSharingRequestPath = data.screenSharingData.sharerPath;
            //        }
            //        otherUserScreenSharingRequestPath += '/' + data.screenSharingData.guid;
            //        dataToSave[otherUserScreenSharingRequestPath] = false;
            //
            //        return data.storage.update(dataToSave);
            //    });
            //};

            this.callsStateChanged = function (receiverId) {
                return UserProfileService.getCurrUserId().then(function(callerId) {
                    _initiateCall(callerId, receiverId);
                });
            };
        }
    );
})(angular);
