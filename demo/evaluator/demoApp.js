(function (angular) {
    'use strict';

    angular.module('demoApp', ['znk.infra.evaluator'])
        .config(function(ZnkEvaluatorSrvProvider) {
            ZnkEvaluatorSrvProvider.shouldEvaluateQuestionFnGetter(function (purchaseService) {
                 return function() {
                     return purchaseService.hasProVersion();
                 }
            });

            ZnkEvaluatorSrvProvider.getEvaluateStatusFnGetter(function (EvaluateStatusEnum) {
                return function() {
                    return EvaluateStatusEnum.NOT_PURCHASE;
                }
            });

            ZnkEvaluatorSrvProvider.isEvaluateQuestionTypeFnGetter(function () {
                return function(question) {
                    return question.manualEvaluation;
                }
            });
        })
        .service('purchaseService', function() { // mock for purchaseService
             this.hasProVersion = function() {
                 return true;
             };
        })
        .service('EvaluateStatusEnum', function() { // mock for purchaseService
            this.NOT_PURCHASE = 1;
        })
        .controller('Main', function ($scope, ZnkEvaluatorSrv) {
            $scope.shouldEvaluateQuestion = function() {
                var fn = ZnkEvaluatorSrv.shouldEvaluateQuestionFn();
                console.log('shouldEvaluateQuestion', fn());

            };
            $scope.isEvaluateQuestionType = function() {
                var fn = ZnkEvaluatorSrv.isEvaluateQuestionTypeFn();
                console.log('isEvaluateQuestionType', fn({
                    manualEvaluation: true
                }));
            };
            $scope.getEvaluateStatus = function() {
                var fn = ZnkEvaluatorSrv.getEvaluateStatusFn();
                console.log('getEvaluateStatus', fn());
            };
        });
})(angular);
