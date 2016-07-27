(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').controller('OutgoingCallModalCtrl',
        function (CallsSrv, CallsUiSrv, $log) {
            'ngInject';
            var callsData = this.scope.callsData;
            this.declineCall = function() {
                CallsSrv.declineCall(callsData).then(function () {
                    CallsUiSrv.closeModal();
                }).catch(function (err) {
                    $log.error('IncomingCallModalCtrl declineCall: err: ' + err);
                });
            };
        }
    );
})(angular);
