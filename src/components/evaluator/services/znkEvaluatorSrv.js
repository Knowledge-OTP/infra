'use strict';

(function (angular) {
    angular.module('znk.infra.evaluator').provider('ZnkEvaluatorSrv', function () {

        var _evaluateQuestionFn;

        var shouldEvaluateQuestionFnDefault = function(purchaseService) {
            'ngInject';
            return purchaseService.hasProVersion();
        };

        this.shouldEvaluateQuestionFn = function(evaluateQuestionFn) {
            _evaluateQuestionFn = evaluateQuestionFn;
        };

        this.$get = function ($q, $injector, ENV, $http, InfraConfigSrv) {
            'ngInject';

            var znkEvaluatorSrvApi = {};

            var httpConfig = {
                timeout: ENV.promiseTimeOut
            };

            function _shouldEvaluateQuestion() {
                if(!_evaluateQuestionFn){
                    _evaluateQuestionFn = shouldEvaluateQuestionFnDefault;
                }

                return $q.when($injector.invoke(_evaluateQuestionFn));
            }

            znkEvaluatorSrvApi.evaluateQuestion = function (questionsArr) {
                return _shouldEvaluateQuestion().then(function (shouldEvaluate) {
                    if (shouldEvaluate) {
                        return InfraConfigSrv.getUserData().then(function(userData) {
                            return $http.post(ENV.evaluateEndpoint, {
                                uid: userData.uid,
                                questionsArr: questionsArr,
                                appName: ENV.firebaseAppScopeName
                            }, httpConfig).then(function(evaluateData) {
                                return evaluateData;
                            }, function(error) {
                                return $q.reject(error);
                            });
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
