(function (angular) {
    'use strict';

    angular.module('znk.infra.znkQuestionReport')
        .component('znkQuestionReport', {
            bindings: {
                reportData: '='
            },
            template: '<svg-icon class="report-btn" name="report-question-icon" data-tooltip="{{\'REPORT_POPUP.REPORT_QUESTION\' | translate}}" ng-click="vm.showReportDialog()"></svg-icon>',
            controller: znkReportComponent,
            controllerAs: 'vm'
        });

        function znkReportComponent($mdDialog, $translatePartialLoader) {
            'ngInject';
            $translatePartialLoader.addPart('znkQuestionReport');
            var vm = this;
            vm.showReportDialog = showReportDialog;

            function showReportDialog () {
                $mdDialog.show({
                    locals:{ reportData: vm.reportData },
                    controller: 'znkReportCtrl',
                    controllerAs: 'vm',
                    templateUrl: 'components/znkQuestionReport/templates/znkReport.template.html',
                    clickOutsideToClose: true
                });
            }
        }
})(angular);
