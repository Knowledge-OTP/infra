(function (angular) {
    'use strict';

    angular.module('demoApp', ['znk.infra.evaluator'])
        .config(function(InfraConfigSrvProvider) {
            InfraConfigSrvProvider.setUserDataFn(function () {
                return {
                    uid: 'uid'
                };
            });
        })
        .service('ENV', function() { // mock for ENV
            this.evaluateEndpoint = 'http://localhost:3009/evaluate/question';
            this.firebaseAppScopeName = 'toefl_app';
            this.promiseTimeOut = 15000;
        })
        .service('purchaseService', function() { // mock for purchaseService
             this.hasProVersion = function() {
                 return true;
             };
        })
        .controller('Main', function ($scope, ZnkEvaluatorSrv) {
            var questionsArr = [{
                afterAllowedTime: true,
                index: 0,
                isAnsweredCorrectly: false,
                questionId: 8691,
                stateId: 4,
                timeSpent: 31935,
                userAnswer: "dfsgdfgdfg fdgdf gdf fdgfdg df  dfg dg"
            }];
            $scope.evaluateQuestion = function() {
                ZnkEvaluatorSrv.evaluateQuestion(questionsArr);
            };
        });
})(angular);
