(function (angular) {
    'use strict';

    angular.module('znk.infra.znkLesson')
        .component('znkLesson', {
            bindings: {},
            templateUrl: 'components/znkLesson/components/lessonBtn/znkLesson.template.html',
            controllerAs: 'vm',
            controller: function ($mdDialog) {
                'ngInject';
                var vm = this;
                vm.isLessonActive = false;

                vm.showLessonModal = function () {
                    $mdDialog.show({
                        controller: 'startLessonCtrl',
                        controllerAs: 'vm',
                        templateUrl: 'components/znkLesson/modals/templates/startLesson.template.html',
                        clickOutsideToClose: true
                    });
                };
            }
        });
})(angular);
