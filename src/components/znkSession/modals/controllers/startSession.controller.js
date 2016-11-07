(function (angular) {
    'use strict';

    angular.module('znk.infra.znkSession').controller('startSessionCtrl',
        function($mdDialog, SessionSrv) {
            'ngInject';

            var vm = this;
            vm.sessionSubjects = SessionSrv.getSessionSubjects();
            vm.closeModal = $mdDialog.cancel;
            vm.startSession = SessionSrv.startSession;

        });
})(angular);
