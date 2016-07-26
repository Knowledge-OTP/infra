(function (angular) {
    'use strict';

    angular.module('demo', [
        'znk.infra.calls',
        'ngAria',
        'ngMaterial',
        'pascalprecht.translate',
        'znk.infra.modal'
    ])
        .config(function (ModalServiceProvider) {
            ModalServiceProvider.setBaseTemplatePath('components/calls/modals/templates/baseCallsModal.template.html');
            // components/calls/modals/templates/incomingCall.template.html
        })
        .run(function ($rootScope) {
            $rootScope.offline = { btnState: 1, receiverId: 1 };
            $rootScope.call = { btnState: 2, receiverId: 1 };
            $rootScope.called = { btnState: 3, receiverId: 1 };
        })
        .controller('demoCtrl', ['$scope', 'CallsUiSrv', function ($scope, CallsUiSrv) {

            var self = this;

            var modalData = {
                'key': 'value',
                'anotherKey': 'anotherValue'
            };

            $scope.openIncomingCallModal = function() {
                console.log('openIncomingCallModal');
                CallsUiSrv.showModal(CallsUiSrv.modals.INCOMING_CALL, modalData);
            };

            $scope.openOutgoingCallModal = function() {
                console.log('openOutgoingCallModal');
                CallsUiSrv.showModal(CallsUiSrv.modals.OUTGOING_CALL, modalData);
            };
        }
        ]);
})(angular);
