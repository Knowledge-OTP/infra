(function (angular) {
    'use strict';

    angular.module('znk.infra.znkLesson').controller('startLessonCtrl',
        function($mdDialog, SubjectEnum, LessonSrv) {
            'ngInject';

            var vm = this;
            vm.lessonsSubjects = LessonSrv.getSubjects();
            vm.closeModal = $mdDialog.cancel;
            vm.startLesson = LessonSrv.startLesson;

        });
})(angular);
