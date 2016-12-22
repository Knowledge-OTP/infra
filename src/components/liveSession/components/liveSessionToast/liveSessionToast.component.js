(function (angular) {
    'use strict';

    angular.module('znk.infra.liveSession')
        .component('liveSessionToast', {
            bindings: {
                type: '=',
                msg: '='
            },
            templateUrl: 'components/liveSession/components/liveSessionToast/liveSessionToast.template.html',
            controllerAs: 'vm',
            controller: function ($mdToast) {
                'ngInject';

                var vm = this;

                vm.closeToast = function () {
                    $mdToast.hide();
                };
            }
        });
})(angular);
