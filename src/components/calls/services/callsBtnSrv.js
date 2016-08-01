(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').service('CallsBtnSrv',
        function (CallsStatusEnum, CallsBtnStatusEnum) {
            'ngInject';

            var btnStatusCallbackMap = {};

            this.setBtnStatusCallback = function(receiverId, cb) {
                btnStatusCallbackMap[receiverId] = cb;
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

                btnStatusCallbackMap[callsData.receiverId](status);
            };

        });
})(angular);
