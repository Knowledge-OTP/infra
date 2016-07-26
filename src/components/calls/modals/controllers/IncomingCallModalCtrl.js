(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').controller('IncomingCallModalCtrl',
        function (modalData, CallsSrv, CallsUiSrv, $log) {
            'ngInject';

            function _baseCall(callFn, methodName) {
                var callsData = modalData.callsData;
                callFn(callsData).then(function () {
                    CallsUiSrv.closeModal();
                }).catch(function (err) {
                    $log.error('IncomingCallModalCtrl '+ methodName +': err: ' + err);
                });
            }

            this.declineCall = _baseCall.bind(null, CallsSrv.declineCall, 'declineCall');

            this.declineCall = _baseCall.bind(null, CallsSrv.acceptCall, 'acceptCall');
        }
    );
})(angular);
