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

            self.showModal = function (modal, callsData) {
                modal.modalData = {
                    callsData: callsData
                };
                ModalService.showBaseModal(modal);
            };

            self.closeModal = function () {
                $mdDialog.hide();
            };

            self.modals = {
                'INCOMING_CALL': {
                    svgIcon: 'incoming-call-icon',
                    innerTemplateUrl: 'components/calls/modals/templates/incomingCall.template.html',
                    controller: 'IncomingCallModalCtrl',
                    overrideCssClass: 'incoming-call-modal'
                },
                'OUTGOING_CALL': {
                    svgIcon: 'outgoing-call-icon',
                    innerTemplateUrl: 'components/calls/modals/templates/outgoingCall.template.html',
                    controller: 'OutgoingCallModalCtrl',
                    overrideCssClass: 'outgoing-call-modal'
                }
            };

        }]
    );
})(angular);
