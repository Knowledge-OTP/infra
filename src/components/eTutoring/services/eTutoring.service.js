(function (angular) {
    'use strict';

    angular.module('znk.infra.eTutoring')
        .provider('ETutoringService', function () {
            'ngInject';
            var getSubjectDataByExerciseWrapper, appName;

            this.setGetSubjectDataByExercise = function (fn) {
                getSubjectDataByExerciseWrapper = fn;
            };

            this.setAppName = function(_appName){
                appName = _appName;
            };

            this.$get = function ($injector, $log, $q) {
                var ETutoringService = {};

                ETutoringService.getSubjectDataByExercise = function (exercise) {
                    if(angular.isUndefined(getSubjectDataByExerciseWrapper)){
                        $log.error('ETutoringService: getSubjectDataByExercise was not set up in config phase!');
                        return $q.when();
                    } else {
                        var getSubjectDataByExercise = $injector.invoke(getSubjectDataByExerciseWrapper);
                        return getSubjectDataByExercise(exercise);
                    }
                };

                ETutoringService.getAppName = function(){
                    return appName;
                };

                return ETutoringService;
            };
        });
})(angular);
