(function (angular) {
    'use strict';

    angular.module('znk.infra.evaluator', []);
})(angular);

'use strict';

(function (angular) {
    angular.module('znk.infra.evaluator').provider('ZnkEvaluatorSrv', function () {

        var _shouldEvaluateQuestionFn;
        var _isEvaluateQuestionFn;
        var _evaluateStatusFn;

        this.shouldEvaluateQuestionFnGetter = function(shouldEvaluateQuestionFn) {
            _shouldEvaluateQuestionFn = shouldEvaluateQuestionFn;
        };

        this.isEvaluateQuestionTypeFnGetter = function(isEvaluateQuestionFn) {
            _isEvaluateQuestionFn = isEvaluateQuestionFn;
        };

        this.getEvaluateStatusFnGetter = function(evaluateStatusFn) {
            _evaluateStatusFn = evaluateStatusFn;
        };

        this.$get = ["$q", "$injector", "$log", function ($q, $injector, $log) {
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

            znkEvaluatorSrvApi.shouldEvaluateQuestionFn = invokeEvaluateFn.bind(null, _shouldEvaluateQuestionFn, 'shouldEvaluateQuestionFn');

            znkEvaluatorSrvApi.isEvaluateQuestionTypeFn = invokeEvaluateFn.bind(null, _isEvaluateQuestionFn, 'isEvaluateQuestionFn');

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
