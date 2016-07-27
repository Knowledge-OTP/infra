(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').controller('IncomingCallModalCtrl',
        function (CallsSrv, CallsUiSrv, CallsStatusEnum, $log) {
            'ngInject';

            var callsData = this.scope.callsData;

            function _baseCall(callFn, methodName) {
                callFn(callsData).then(function () {
                    CallsUiSrv.closeModal();
                }).catch(function (err) {
                    $log.error('IncomingCallModalCtrl '+ methodName +': err: ' + err);
                });
            }

            this.declineCall = _baseCall.bind(null, CallsSrv.declineCall, 'declineCall');

            this.acceptCall = _baseCall.bind(null, CallsSrv.acceptCall, 'acceptCall');

            this.closeModalAndDisconnect = _baseCall.bind(null, CallsSrv.disconnectCall, 'disconnectCall');
        }
    );
})(angular);
