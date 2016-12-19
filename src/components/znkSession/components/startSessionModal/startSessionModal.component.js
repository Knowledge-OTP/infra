(function (angular) {
    'use strict';

    angular.module('znk.infra.znkSession')
        .component('startSessionModal', {
            bindings: {},
            templateUrl: 'components/znkSession/components/startSessionModal/startSessionModal.template.html',
            controllerAs: 'vm',
            controller: function($mdDialog, SessionSrv) {
                'ngInject';

                var vm = this;
                vm.sessionSubjects = SessionSrv.getSessionSubjects();
                vm.closeModal = $mdDialog.cancel;
                vm.startSession = SessionSrv.startSession;

            }
        });
})(angular);
