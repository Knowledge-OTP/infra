(function (angular) {
    'use strict';

    angular.module('znk.infra.znkLesson').controller('startLessonCtrl',
        function($mdDialog, $http, $translate, ENV, AuthService, SubjectEnum) {
            'ngInject';

            var vm = this;
            var userAuth = AuthService.getAuth();

            vm.lessonsSubjects = [
                {id: 0, name: SubjectEnum.MATH.val, iconName: 'znkLesson-math-icon'},
                {id: 5, name: SubjectEnum.ENGLISH.val, iconName: 'znkLesson-english-icon'}
            ];

            // vm.reportData.app = ENV.firebaseAppScopeName.split('_')[0].toUpperCase();
            // vm.reportData.email = userAuth.auth.email;

            vm.openActivePanel = function (subject) {
                console.log('openActivePanel, subject name: ', subject);
            };

            vm.cancel = function () {
                $mdDialog.cancel();
            };
        });
})(angular);
