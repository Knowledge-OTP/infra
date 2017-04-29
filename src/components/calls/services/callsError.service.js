(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').service('CallsErrorSrv',
        function (CallsUiSrv, $q) {
            'ngInject';

            var errorCodesList = {
                1: 'microphone', // this is define in webcall module, if it's changed here, it should changed there also.
                2: 'general',
                3: 'alreadyActive'
            };

            var CALLS_ERROR_TEXT = {
                microphone: '.CALL_FAILED_DESC_MICROPHONE',
                general: '.CALL_FAILED_DESC_GENERAL',
                alreadyActive: '.CALL_FAILED_DESC_ALREADY_ACTIVE'
            };

            function _showErrorModal(err) {
                var errorCode = err && err.errorCode ? errorCodesList[err.errorCode] : errorCodesList[2];
                var modalData = {};
                var errorProm = $q.when(false);

                switch (errorCode) {
                    case 'microphone':
                        modalData.errorMessage = CALLS_ERROR_TEXT.microphone;
                        break;
                    case 'general':
                        modalData.errorMessage = CALLS_ERROR_TEXT.general;
                        break;
                    case 'alreadyActive':
                        modalData.errorMessage = CALLS_ERROR_TEXT.alreadyActive;
                        errorProm = CallsUiSrv.getCalleeName(err.receiverId).then(function (name) {
                            modalData.errorValues = {
                                calleeName: name
                            };
                            return modalData;
                        });
                        break;
                    default:
                        modalData.errorMessage = CALLS_ERROR_TEXT.general;
                        break;
                }

                return errorProm.then(function () {
                    return CallsUiSrv.showErrorModal(CallsUiSrv.modals.ERROR, modalData);
                });
            }

            this.showErrorModal = function(err) {
                return _showErrorModal(err);
            };

        });
})(angular);
