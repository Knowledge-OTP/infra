(function (angular) {
    'use strict';

    angular.module('znk.infra.znkQuestionReport')
        .component('znkQuestionReport', {
            bindings: {
                reportData: '='
            },
            template: '<svg-icon class="report-btn" name="report-question-icon" ' +
            'title="{{\'REPORT_POPUP.REPORT_QUESTION\' | translate}}" ng-hide="vm.isLectureType" ng-click="vm.showReportDialog()"></svg-icon>',
            controllerAs: 'vm',
            controller: function ($mdDialog, ExerciseTypeEnum) {
                'ngInject';
                var vm = this;

                vm.isLectureType = vm.reportData.exerciseTypeId === ExerciseTypeEnum.LECTURE.enum;
                vm.showReportDialog = function () {
                    $mdDialog.show({
                        locals:{ reportData: vm.reportData },
                        controller: 'znkReportCtrl',
                        controllerAs: 'vm',
                        templateUrl: 'components/znkQuestionReport/components/znkReport/znkReport.template.html',
                        clickOutsideToClose: true
                    });
                };
            }
        });
})(angular);
