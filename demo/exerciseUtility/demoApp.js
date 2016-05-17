(function (angular) {
    'use strict';

    angular.module('demo', [
        'znk.infra.exerciseUtility',
        'znk.infra.config'
    ])
        .controller('Main', function (WorkoutsSrv, $scope) {
            $scope.getWorkouts = function () {
                WorkoutsSrv.getAllWorkouts().then(function (workouts) {
                    $scope.workouts = workouts;
                });
            };
        });
})(angular);
