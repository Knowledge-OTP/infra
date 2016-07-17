(function (angular) {
    'use strict';

    angular.module('znk.infra.evaluator', []);
})(angular);

'use strict';

(function (angular) {
    angular.module('znk.infra.evaluator').provider('ZnkEvaluatorSrv', function () {

        var _evaluateQuestionFn;
        var _evaluateStatusFn;

        this.shouldEvaluateQuestionFnGetter = function(evaluateQuestionFn) {
            _evaluateQuestionFn = evaluateQuestionFn;
        };

        this.getEvaluateStatusFnGetter = function(evaluateStatusFn) {
            _evaluateStatusFn = evaluateStatusFn;
        };

        this.$get = ["$q", "$injector", "$log", function ($q, $injector, $log) {
            'ngInject';

            var znkEvaluatorSrvApi = {};

            function invokeEvaluateFn(evaluateFn, evaluateFnName) {
                if(!evaluateFn) {
                    var errMsg = 'ZnkEvaluatorSrv: '+ evaluateFnName +' was not set';
                    $log.error(errMsg);
                    return $q.reject(errMsg);
                }

                return $q.when($injector.invoke(evaluateFn));
            }

            znkEvaluatorSrvApi.shouldEvaluateQuestionFn = invokeEvaluateFn.bind(null, _evaluateQuestionFn, 'evaluateQuestionFn');

            znkEvaluatorSrvApi.getEvaluateStatusFn = invokeEvaluateFn.bind(null, _evaluateStatusFn, 'evaluateStatusFn');

            znkEvaluatorSrvApi.evaluateQuestion = function () {
                //@todo(oded) implement saving data to firebase
            };

            return znkEvaluatorSrvApi;
        }];
    });
})(angular);

angular.module('znk.infra.evaluator').run(['$templateCache', function($templateCache) {

}]);
