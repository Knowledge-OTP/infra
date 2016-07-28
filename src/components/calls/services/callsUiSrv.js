(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').service('CallsUiSrv', [
        '$mdDialog', 'ModalService',
        function ($mdDialog, ModalService) {
            'ngInject';

            var self = this;

            var activeCallStatus;

            self.showActiveCallDrv = function() {
                activeCallStatus = true;
            };

            self.hideActiveCallDrv = function() {
                activeCallStatus = false;
            };

            self.showModal = function (modal, scope) {
                modal.scope = scope;
                ModalService.showBaseModal(modal);
            };

            self.closeModal = function () {
                $mdDialog.hide();
            };

            self.modals = {
                'INCOMING_CALL': {
                    svgIcon: 'incoming-call-icon',
                    baseTemplateUrl: 'components/calls/modals/templates/baseCallsModal.template.html',
                    innerTemplateUrl: 'components/calls/modals/templates/incomingCall.template.html',
                    controller: 'IncomingCallModalCtrl',
                    overrideCssClass: 'incoming-call-modal',
                    clickOutsideToClose: false,
                    escapeToClose: false
                },
                'OUTGOING_CALL': {
                    svgIcon: 'outgoing-call-icon',
                    baseTemplateUrl: 'components/calls/modals/templates/baseCallsModal.template.html',
                    innerTemplateUrl: 'components/calls/modals/templates/outgoingCall.template.html',
                    controller: 'OutgoingCallModalCtrl',
                    overrideCssClass: 'outgoing-call-modal',
                    clickOutsideToClose: false,
                    escapeToClose: false
                }
            };

        }]
    );
})(angular);
