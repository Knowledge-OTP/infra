(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').service('CallsBtnSrv',
        function (CallsStatusEnum, CallsBtnStatusEnum, UserProfileService, $log, CallsDataGetterSrv) {
            'ngInject';

            var self = this;

             this.getBtnStatus = function _getBtnStatus(callStatus) {
                 var status;
                 
                switch(callStatus) {
                    case CallsStatusEnum.ACTIVE_CALL.enum:
                        status = CallsBtnStatusEnum.CALLED_BTN.enum;
                        break;
                    default:
                        status = CallsBtnStatusEnum.CALL_BTN.enum;    
                }
                 
                return status;
            };

            this.initializeBtnStatus = function(receiverId) {
                return CallsDataGetterSrv.getCallStatus(receiverId).then(function(status) {
                    return self.getBtnStatus(status);
                });
            };

            this.updateBtnStatus = function(receiverId, callsData) {
                return UserProfileService.getCurrUserId().then(function(callerId) {
                    var status = false;
                    if (CallsDataGetterSrv.isCallDataHasReceiverIdOrCallerId(callsData, receiverId, callerId)) {
                         status = self.getBtnStatus(callsData.status);
                    }
                    return status;
                }).catch(function(err){
                    $log.error('Error in CallsBtnSrv updateBtnStatus in UserProfileService.getCurrUserId(): err: ' + err);
                });
            };
        });
})(angular);
