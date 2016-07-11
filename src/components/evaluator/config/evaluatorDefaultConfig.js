(function (angular) {
    'use strict';

    angular.module('znk.infra.evaluatorDefaultConfig', []).config(function(ZnkEvaluatorSrvProvider) {
        'ngInject';

        ZnkEvaluatorSrvProvider.shouldEvaluateQuestion(function(purchaseService) {
            'ngInject';// jshint ignore:line
            return purchaseService.hasProVersion();
        });
    });
})(angular);
