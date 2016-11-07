(function (angular) {
    'use strict';

    angular.module('znk.infra.znkSession')
        .component('znkSession', {
            bindings: {},
            templateUrl: 'components/znkSession/components/sessionBtn/znkSession.template.html',
            controllerAs: 'vm',
            controller: function ($mdDialog) {
                'ngInject';
                var vm = this;
                vm.isSessionActive = false;

                vm.showSessionModal = function () {
                    $mdDialog.show({
                        controller: 'startSessionCtrl',
                        controllerAs: 'vm',
                        templateUrl: 'components/znkSession/modals/templates/startSession.template.html',
                        clickOutsideToClose: true
                    });
                };
            }
        });
})(angular);
