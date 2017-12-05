(function (angular) {
    'use strict';

    angular.module('znk.infra.callsModals', []);
})(angular);

(function (angular) {
    'use strict';

    function CallsModalService() {
        'ngInject';
        var baseTemplateUrl;

        this.setBaseTemplatePath = function(templateUrl) {
            baseTemplateUrl = templateUrl;
        };

        this.$get = function($mdDialog, $rootScope) {
            var CallsModalService = {};

            CallsModalService.showBaseModal = function (popupData) {
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
                    scope: popupData.scope || $rootScope.$new(),
                    bindToController: true,
                    controller: popupData.controller,
                    controllerAs: 'vm',
                    templateUrl: baseTemplateUrl || popupData.baseTemplateUrl,
                    clickOutsideToClose: angular.isDefined(popupData.clickOutsideToClose) ? popupData.clickOutsideToClose : true,
                    escapeToClose: angular.isDefined(popupData.escapeToClose) ? popupData.escapeToClose : true
                });
            };

            return CallsModalService;
        };
    }

    angular.module('znk.infra.callsModals').provider('CallsModalService', CallsModalService);

})(angular);
