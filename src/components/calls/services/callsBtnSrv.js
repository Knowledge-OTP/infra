(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').service('CallsBtnSrv',
        function (CallsStatusEnum, CallsBtnStatusEnum, UserProfileService, $log) {
            'ngInject';

            var btnStatusCallbackMap = {};

            this.setBtnStatusCallback = function(receiverId, cb) {
                if (!btnStatusCallbackMap[receiverId]) {
                    btnStatusCallbackMap[receiverId] = [];
                }

                btnStatusCallbackMap[receiverId].push({
                    cb: cb,
                    status: false
                });
            };

            this.updateStatusMap = function(callsData) {
                if (!callsData.status && !callsData.receiverId) {
                    return;
                }
                var status;
                switch(callsData.status) {
                    case CallsStatusEnum.PENDING_CALL.enum:
                        status = CallsBtnStatusEnum.CALLED_BTN.enum;
                        break;
                    case CallsStatusEnum.DECLINE_CALL.enum:
                        status = CallsBtnStatusEnum.CALL_BTN.enum;
                        break;
                    case CallsStatusEnum.ACTIVE_CALL.enum:
                        status = CallsBtnStatusEnum.CALLED_BTN.enum;
                        break;
                    case CallsStatusEnum.ENDED_CALL.enum:
                        status = CallsBtnStatusEnum.CALL_BTN.enum;
                }

                angular.forEach(btnStatusCallbackMap[callsData.receiverId], function(statusObj) {
                    statusObj.status = status;
                    statusObj.cb(status);
                });

                angular.forEach(btnStatusCallbackMap[callsData.callerId], function(statusObj) {
                    statusObj.status = status;
                    statusObj.cb(status);
                });
            };

            this.initializeSetBtnStatus = function(receiverId) {
                return UserProfileService.getCurrUserId().then(function(callerId) {
                    for (var idKey in btnStatusCallbackMap) {
                        if (btnStatusCallbackMap.hasOwnProperty(idKey)) {
                            if (idKey === receiverId || idKey === callerId) {
                                var btnStatusCallArr = btnStatusCallbackMap[idKey];
                                angular.forEach(btnStatusCallArr, function(statusObj) {
                                    if (statusObj.status) {
                                        statusObj.cb(statusObj.status);
                                    }
                                });
                                break;
                            }
                        }
                    }
                }).catch(function(err){
                    $log.error('Error in CallsBtnSrv initializeSetBtnStatus: err: ' + err);
                });
            };

        });
})(angular);
