(function (angular) {
    'use strict';

    angular.module('znk.infra.znkQuestionReport')
        .component('znkQuestionReport', {
            bindings: {
                reportData: '='
            },
            template: '<svg-icon class="report-btn" name="report-question-icon" title="{{\'REPORT_POPUP.REPORT_QUESTION\' | translate}}" ng-click="vm.showReportDialog()"></svg-icon>',
            controllerAs: 'vm',
            controller: function ($mdDialog, $translatePartialLoader) {
                'ngInject';
                var vm = this;

                $translatePartialLoader.addPart('znkQuestionReport');

                vm.showReportDialog = function () {
                    $mdDialog.show({
                        locals:{ reportData: vm.reportData },
                        controller: 'znkReportCtrl',
                        controllerAs: 'vm',
                        templateUrl: 'components/znkQuestionReport/templates/znkReport.template.html',
                        clickOutsideToClose: true
                    });
                };
            }
        });
})(angular);
