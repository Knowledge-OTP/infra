(function (angular) {
    'use strict';

    angular.module('znk.infra.evaluator', ['znk.infra.config']);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.evaluatorDefaultConfig', []).config(["ZnkEvaluatorSrvProvider", function(ZnkEvaluatorSrvProvider) {
        'ngInject';

        ZnkEvaluatorSrvProvider.shouldEvaluateQuestion(["purchaseService", function(purchaseService) {
            'ngInject';// jshint ignore:line
            return purchaseService.hasProVersion();
        }]);
    }]);
})(angular);

'use strict';

(function (angular) {
    angular.module('znk.infra.evaluator').provider('ZnkEvaluatorSrv', function () {

        var _evaluateQuestionGetter;

        this.shouldEvaluateQuestion = function(evaluateQuestionGetter) {
            _evaluateQuestionGetter = evaluateQuestionGetter;
        };

        this.$get = ["$log", "$q", "$injector", "ENV", "$http", "InfraConfigSrv", function ($log, $q, $injector, ENV, $http, InfraConfigSrv) {
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
        }];
    });
})(angular);

angular.module('znk.infra.evaluator').run(['$templateCache', function($templateCache) {

}]);
