(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').provider('CallsUiSrv',
        function () {
            'ngInject';

            var calleeNameFn = {};
            this.setCalleeNameFnGetter = function (func) {
                calleeNameFn = func;
            };

            this.$get = function ($mdDialog, CallsModalService, $injector) {

                var CallsUiSrv = {};

                CallsUiSrv.showModal = function (modal, scope) {
                    modal.scope = scope;
                    CallsModalService.showBaseModal(modal);
                };

                CallsUiSrv.showErrorModal = function (modal, modalData) {
                    modal.modalData = modalData;
                    CallsModalService.showBaseModal(modal);
                };

                CallsUiSrv.closeModal = function () {
                    $mdDialog.hide();
                };

                CallsUiSrv.modals = {
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
                        svgIcon: 'call-error-exclamation-mark-icon',
                        baseTemplateUrl: 'components/calls/modals/templates/baseCallsModal.template.html',
                        innerTemplateUrl: 'components/calls/modals/templates/errorModal.template.html',
                        controller: 'ErrorModalCtrl',
                        overrideCssClass: 'call-error-modal',
                        clickOutsideToClose: false,
                        escapeToClose: false
                    }
                };

                CallsUiSrv.getCalleeName = function(receiverId, callerId) {
                    var namePromOrFnGetter = $injector.invoke(calleeNameFn);
                    var nameProm = namePromOrFnGetter(receiverId, callerId);
                    return nameProm.then(function(res){
                        return res;
                    });
                };

                return CallsUiSrv;
            };
        }
    );
})(angular);
