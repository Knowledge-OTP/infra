(function (angular) {
    'use strict';

    angular.module('znk.infra.znkLesson').controller('startLessonCtrl',
        function($mdDialog, SubjectEnum, LessonSrv) {
            'ngInject';

            function openActivePanel(subject) {
                console.log('openActivePanel, subject name: ', subject.name);
            }

            var vm = this;
            vm.lessonsSubjects = LessonSrv.getSubjects();
            vm.cancel = function () {
                $mdDialog.cancel();
            };

            vm.subjectClicked = function (subject) {
                LessonSrv.saveLesson(subject);
                openActivePanel(subject);
                vm.cancel();
            }
        });
})(angular);
