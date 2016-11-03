(function (angular) {
    'use strict';

    angular.module('znk.infra.znkLesson').controller('startLessonCtrl',
        function($mdDialog, SubjectEnum, LessonSrv) {
            'ngInject';

            var vm = this;
            vm.saveLesson = LessonSrv.saveLesson;

            vm.lessonsSubjects = [
                {id: 0, name: SubjectEnum.MATH.val, iconName: 'znkLesson-math-icon'},
                {id: 5, name: SubjectEnum.ENGLISH.val, iconName: 'znkLesson-english-icon'}
            ];

            vm.openActivePanel = function (subject) {
                console.log('openActivePanel, subject name: ', subject.name);
            };

            vm.cancel = function () {
                $mdDialog.cancel();
            };
        });
})(angular);
