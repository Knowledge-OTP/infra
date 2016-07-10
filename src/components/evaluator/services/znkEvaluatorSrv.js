'use strict';

(function (angular) {
    angular.module('znk.infra.evaluator').provider('ZnkEvaluatorSrv', function () {

        var _evaluateQuestionGetter;

        this.shouldEvaluateQuestion = function(evaluateQuestionGetter) {
            _evaluateQuestionGetter = evaluateQuestionGetter;
        };

        this.$get = function ($log, $q, $injector, ENV, $http) {
           'ngInject';

           var znkEvaluatorSrvApi = {};

            var httpConfig = {
                timeout: ENV.promiseTimeOut
            };

            function _shouldEvaluateQuestion() {
                if(!_evaluateQuestionGetter){
                    var errMsg = 'ZnkEvaluatorSrv: evaluateQuestionGetter was not set';
                    $log.error(errMsg);
                    return $q.reject(errMsg);
                }

                return $q.when($injector.invoke(_evaluateQuestionGetter));
            }

            znkEvaluatorSrvApi.evaluateQuestion = function (questionsArr) {
                return _shouldEvaluateQuestion().then(function (shouldEvaluate) {
                       if (shouldEvaluate) {
                           return $http.post(ENV.evaluateEndpoint, {
                               questionsArr: questionsArr,
                               appName: ENV.firebaseAppScopeName
                           }, httpConfig).then(function(evaluateData) {
                               return evaluateData;
                           }, function(error) {
                               return $q.reject(error);
                           });
                       }
                });
            };

            return znkEvaluatorSrvApi;
        };
    });
})(angular);
