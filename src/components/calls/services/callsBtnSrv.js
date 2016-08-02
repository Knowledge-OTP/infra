(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').service('CallsBtnSrv',
        function (CallsStatusEnum, CallsBtnStatusEnum, UserProfileService, $log, CallsDataGetterSrv) {
            'ngInject';

             var self = this;

             this.getBtnStatus = function _getBtnStatus(callStatus) {
                var status;
                switch(callStatus) {
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
                return status;
            };

            this.initializeBtnStatus = function(receiverId) {
                return UserProfileService.getCurrUserId().then(function(callerId) {
                    return CallsDataGetterSrv.getCurrUserCallsData().then(function (callsDataMap) {
                        var status = false;
                        for (var idKey in callsDataMap) {
                            if (callsDataMap.hasOwnProperty(idKey)) {
                                var currCallsData = callsDataMap[idKey];
                                if (currCallsData.receiverId === receiverId ||
                                    currCallsData.callerId === callerId) {
                                    status = self.getBtnStatus(currCallsData.status);
                                    break;
                                }
                            }
                        }
                        return status;
                    }).catch(function(err){
                        $log.error('Error in CallsBtnSrv initializeSetBtnStatus in CallsDataGetterSrv.getCurrUserCallsData(), err: ' + err);
                    });
                }).catch(function(err){
                    $log.error('Error in CallsBtnSrv initializeSetBtnStatus in UserProfileService.getCurrUserId(): err: ' + err);
                });
            };

            this.updateBtnStatus = function(receiverId, callsData) {
                return UserProfileService.getCurrUserId().then(function(callerId) {
                    var status = false;
                    if (callsData.receiverId === (receiverId || callerId) ||
                        callsData.callerId === (callerId || receiverId)) {
                         status = self.getBtnStatus(callsData.status);
                    }
                    return status;
                }).catch(function(err){
                    $log.error('Error in CallsBtnSrv updateBtnStatus in UserProfileService.getCurrUserId(): err: ' + err);
                });
            };

        });
})(angular);
