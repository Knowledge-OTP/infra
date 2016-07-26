(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').service('CallsUiSrv', [
        '$mdDialog', 'ModalService',
        function ($mdDialog, ModalService) {
            'ngInject';

            var self = this;

            self.showModal = function (modal, modalData) {
                ModalService.showBaseModal(modal, modalData);
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
