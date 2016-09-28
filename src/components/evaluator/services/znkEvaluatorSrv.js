'use strict';

(function (angular) {
    angular.module('znk.infra.evaluator').provider('ZnkEvaluatorSrv', function () {
        var self = this;

        var evaluateFnMap = {};

        var evaluateFnArr = [
            'shouldEvaluateQuestion',
            'isEvaluateQuestion',
            'isEvaluateExerciseTypeFn',
            'evaluateStatusFn'
        ];

        angular.forEach(evaluateFnArr, function(fnName) {
            self[fnName + 'Getter'] = function(fn) {
                evaluateFnMap[fnName] = fn;
            };
        });

        this.$get = function ($q, $injector, $log) {
            'ngInject';

            var znkEvaluatorSrvApi = {};

            function handleErrors(evaluateFnName) {
                var errMsg = 'ZnkEvaluatorSrv: '+ evaluateFnName +' was not set';
                $log.error(errMsg);
                return $q.reject(errMsg);
            }

            function invokeEvaluateFn(evaluateFn, evaluateFnName) {
                if(!evaluateFn) {
                    return handleErrors(evaluateFnName);
                }

                try {
                    return $injector.invoke(evaluateFn);
                } catch (e) {
                    return handleErrors(evaluateFnName +' e: ' + e);
                }
            }

            angular.forEach(evaluateFnArr, function(fnName) {
                znkEvaluatorSrvApi[fnName] = invokeEvaluateFn.bind(null, evaluateFnMap[fnName], fnName);
            });

            znkEvaluatorSrvApi.evaluateQuestion = function () {
                //@todo(oded) implement saving data to firebase
            };

            return znkEvaluatorSrvApi;
        };
    });
})(angular);
