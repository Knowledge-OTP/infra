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
                var fnGetter = ZnkEvaluatorSrv.shouldEvaluateQuestionFn();
                fnGetter.then(function (fn) {
                    console.log('shouldEvaluateQuestion', fn());
                });
            };
            $scope.isEvaluateQuestionType = function() {
                var fnGetter = ZnkEvaluatorSrv.isEvaluateQuestionTypeFn();
                fnGetter.then(function (fn) {
                    console.log('isEvaluateQuestionType', fn({
                        manualEvaluation: true
                    }));
                });
            };
            $scope.getEvaluateStatus = function() {
                var fnGetter = ZnkEvaluatorSrv.getEvaluateStatusFn();
                fnGetter.then(function (fn) {
                    console.log('getEvaluateStatus', fn());
                });
            };
        });
})(angular);
