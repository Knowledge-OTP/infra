(function (angular) {
    'use strict';

    angular.module('znk.infra.liveSession')
        .component('liveSessionToast', {
            bindings: {},
            templateUrl: 'components/liveSession/components/liveSessionToast/liveSessionToast.template.html',
            controllerAs: 'vm',
            controller: function ($mdToast) {
                'ngInject';

                var vm = this;
                vm.type = 'success';
                vm.msg = 'baba';
                vm.closeToast = function () {
                    $mdToast.hide();
                };
                // this.$onInit = function () {
                //
                // };
            }
        });
})(angular);
