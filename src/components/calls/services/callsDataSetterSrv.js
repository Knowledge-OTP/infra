(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').service('CallsDataSetterSrv',
        function (InfraConfigSrv, $q, ENV, CallsStatusEnum, CallsDataGetterSrv) {
            'ngInject';

            function _getStorage() {
                return InfraConfigSrv.getGlobalStorage();
            }

            this.setNewConnect = function(data, userCallData, guid, isTeacherApp) {
                var dataToSave = {};
                var isCallerTeacher = userCallData.callerId === data.currUid && isTeacherApp;
                var receiverPath = CallsDataGetterSrv.getCallsRequestsPath(userCallData.newReceiverId, !isCallerTeacher);
                var callerPath = CallsDataGetterSrv.getCallsRequestsPath(userCallData.callerId, isCallerTeacher);
                var newCallData = {
                    guid: guid,
                    callerId: userCallData.callerId,
                    receiverId: userCallData.newReceiverId,
                    status: CallsStatusEnum.PENDING_CALL.enum,
                    callerPath: callerPath,
                    receiverPath: receiverPath,
                    startedTime: Date.now()
                };
                // update root call
                angular.extend(data.currCallData, newCallData);
                dataToSave[data.currCallData.$$path] = data.currCallData;
                //current user call requests object update
                data.currUserCallsRequests[guid] = true;
                dataToSave[data.currUserCallsRequests.$$path] = data.currUserCallsRequests;
                //other user call requests object update
                var otherUserCallPath = userCallData.newReceiverId === data.currUid ? callerPath : receiverPath;
                var otherUserCallDataGuidPath = otherUserCallPath + '/' + guid;
                dataToSave[otherUserCallDataGuidPath] = true;
                return _getStorage().then(function (StudentStorage) {
                    return StudentStorage.update(dataToSave);
                });
            };

            this.setDisconnectCall = function(data, userCallData, guid) {
                var dataToSave = {};
                // update root
                data.currCallData.status = CallsStatusEnum.ENDED_CALL.enum;
                data.currCallData.endedTime = Date.now();
                dataToSave[data.currCallData.$$path] = angular.copy(data.currCallData);
                //current user call requests object update
                data.currUserCallsRequests[guid] = null;
                dataToSave[data.currUserCallsRequests.$$path] = data.currUserCallsRequests;
                //other user call requests object update
                var otherUserCallPath = userCallData.receiverId === data.currUid ? data.currCallData.callerPath : data.currCallData.receiverPath;
                var otherUserCallDataGuidPath = otherUserCallPath + '/' + guid;
                dataToSave[otherUserCallDataGuidPath] = null;
                return _getStorage().then(function (StudentStorage) {
                    return StudentStorage.update(dataToSave);
                });
            };

            this.setDeclineCall = function(data, userCallData, guid) {
                var dataToSave = {};
                // update root
                data.currCallData.status = CallsStatusEnum.DECLINE_CALL.enum;
                data.currCallData.endedTime = Date.now();
                dataToSave[data.currCallData.$$path] = angular.copy(data.currCallData);
                //current user call requests object update
                data.currUserCallsRequests[guid] = null;
                dataToSave[data.currUserCallsRequests.$$path] = data.currUserCallsRequests;
                //other user call requests object update
                var otherUserCallPath = userCallData.receiverId === data.currUid ? data.currCallData.callerPath : data.currCallData.receiverPath;
                var otherUserCallDataGuidPath = otherUserCallPath + '/' + guid;
                dataToSave[otherUserCallDataGuidPath] = null;

                return _getStorage().then(function (StudentStorage) {
                    return StudentStorage.update(dataToSave);
                });
            };

            this.setAcceptCall = function(currCallData) {
                var dataToSave = {};
                // update root
                currCallData.status = CallsStatusEnum.ACTIVE_CALL.enum;
                dataToSave[currCallData.$$path] = angular.copy(currCallData);
                return _getStorage().then(function (StudentStorage) {
                    return StudentStorage.update(dataToSave);
                });
            };

        }
    );
})(angular);
