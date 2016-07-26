(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').controller('IncomingCallModalCtrl', [
        function (modalData, CallsSrv, CallsUiSrv, $log) {
            'ngInject';

            this.declineCall = function() {
                var callsData = modalData.callsData;
                CallsSrv.declineCall(callsData).then(function () {
                    CallsUiSrv.closeModal();
                }).catch(function (err) {
                    $log.error('IncomingCallModalCtrl declineCall: err: ' + err);
                });
            };

            this.acceptCall = function() {
                var callsData = modalData.callsData;
                CallsSrv.acceptCall(callsData).then(function () {
                    CallsUiSrv.closeModal();
                }).catch(function (err) {
                    $log.error('IncomingCallModalCtrl acceptCall: err: ' + err);
                });
            };
        }]
    );
})(angular);
