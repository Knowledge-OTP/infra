'use strict';

(function (angular) {

    function ModalService() {

        var baseTemplateUrl;

        this.setBaseTemplatePath = function(templateUrl) {
            baseTemplateUrl = templateUrl;
        };

        this.$get = ['$mdDialog', function($mdDialog) {
            var ModalService = {};

            ModalService.showBaseModal = function (popupData) {
                $mdDialog.show({
                    locals: {
                        svgIcon: popupData.svgIcon,
                        innerTemplateUrl: popupData.innerTemplateUrl,
                        overrideCssClass: popupData.overrideCssClass,
                        modalData: popupData.modalData,
                        modalName: popupData.modalName,
                        closeModal: function closeModal (){
                            $mdDialog.hide();
                        }
                    },
                    bindToController: true,
                    controller: popupData.controller,
                    controllerAs: 'vm',
                    templateUrl: baseTemplateUrl,
                    clickOutsideToClose: true,
                    escapeToClose: true
                });
            };

            return ModalService;
        }];
    }

    angular.module('znk.infra.modal').provider('ModalService', ModalService);

})(angular);
