(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').service('CallsUiSrv', [
        '$mdDialog', 'CallsModalService',
        function ($mdDialog, CallsModalService) {
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
                CallsModalService.showBaseModal(modal);
            };

            self.showErrorModal = function (modal, modalData) {
                modal.modalData = modalData;
                CallsModalService.showBaseModal(modal);
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
                },
                'ERROR': {
                    svgIcon: 'exclamation-mark-icon',
                    baseTemplateUrl: 'components/calls/modals/templates/baseCallsModal.template.html',
                    innerTemplateUrl: 'components/calls/modals/templates/errorModal.template.html',
                    controller: 'ErrorModalCtrl',
                    overrideCssClass: 'call-error-modal',
                    clickOutsideToClose: false,
                    escapeToClose: false
                }
            };

        }]
    );
})(angular);
