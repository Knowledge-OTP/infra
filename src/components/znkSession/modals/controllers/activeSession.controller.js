(function (angular) {
    'use strict';

    angular.module('znk.infra.znkSession').controller('activeSessionCtrl',
        function($mdDialog) {
            'ngInject';

            var vm = this;
            vm.closeModal = $mdDialog.cancel;

        });
})(angular);
