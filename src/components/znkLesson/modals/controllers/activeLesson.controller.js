(function (angular) {
    'use strict';

    angular.module('znk.infra.znkLesson').controller('activeLessonCtrl',
        function($mdDialog, SubjectEnum, LessonSrv) {
            'ngInject';

            var vm = this;
            vm.lessonsSubjects = LessonSrv.getSubjects();
            vm.closeModal = $mdDialog.cancel;

        });
})(angular);
