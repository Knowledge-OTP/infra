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
                var receiverActivePath = CallsDataGetterSrv.getCallsRequestsPath(userCallData.newReceiverId, !isCallerTeacher);
                var callerActivePath = CallsDataGetterSrv.getCallsRequestsPath(userCallData.callerId, isCallerTeacher);
                var receiverArchivePath = CallsDataGetterSrv.getCallsArchivePath(userCallData.newReceiverId, !isCallerTeacher);
                var callerArchivePath = CallsDataGetterSrv.getCallsArchivePath(userCallData.callerId, isCallerTeacher);
                var newCallData = {
                    guid: guid,
                    callerId: userCallData.callerId,
                    receiverId: userCallData.newReceiverId,
                    status: CallsStatusEnum.PENDING_CALL.enum,
                    callerActivePath: callerActivePath,
                    receiverActivePath: receiverActivePath,
                    callerArchivePath: callerArchivePath,
                    receiverArchivePath: receiverArchivePath,
                    startedTime: Date.now()
                };
                // update root call
                angular.extend(data.currCallData, newCallData);
                dataToSave[data.currCallData.$$path] = data.currCallData;
                // update receiverActivePath
                var receiverActiveGuidPath = receiverActivePath + '/' + guid;
                dataToSave[receiverActiveGuidPath] = true;
                // update callerActivePath
                var callerActiveGuidPath = callerActivePath + '/' + guid;
                dataToSave[callerActiveGuidPath] = true;

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

                // update receiverActivePath
                dataToSave[data.currCallData.receiverActivePath] = null;
                // update callerActivePath
                dataToSave[data.currCallData.callerActivePath] = null;

                // update receiverArchivePath
                var receiverArchiveGuidPath = data.currCallData.receiverArchivePath + '/' + guid;
                dataToSave[receiverArchiveGuidPath] = false;
                // update callerArchivePath
                var callerArchiveGuidPath = data.currCallData.callerArchivePath + '/' + guid;
                dataToSave[callerArchiveGuidPath] = false;

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

                // update receiverActivePath
                dataToSave[data.currCallData.receiverActivePath] = null;
                // update callerActivePath
                dataToSave[data.currCallData.callerActivePath] = null;

                // update receiverArchivePath
                var receiverArchiveGuidPath = data.currCallData.receiverArchivePath + '/' + guid;
                dataToSave[receiverArchiveGuidPath] = false;
                // update callerArchivePath
                var callerArchiveGuidPath = data.currCallData.callerArchivePath + '/' + guid;
                dataToSave[callerArchiveGuidPath] = false;

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
