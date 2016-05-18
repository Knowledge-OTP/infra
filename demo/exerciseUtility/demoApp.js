(function (angular) {
    'use strict';

    angular.module('demo', [
        'znk.infra.exerciseUtility',
        'znk.infra.config'
    ])
        .controller('Main', function (WorkoutsSrv, $scope) {
            $scope.workoutIdToRetrieveData = $scope.exerciseOrder = 1;

            $scope.getWorkouts = function () {
                WorkoutsSrv.getAllWorkouts().then(function (workouts) {
                    $scope.workouts = workouts;
                });
            };

            $scope.updateWorkout = function(){
                var workoutId = $scope.exerciseOrder;
                WorkoutsSrv.getAllWorkouts().then(function (workouts) {
                    var workoutCopy = angular.copy(workouts[workoutId - 1]);
                    angular.extend(workoutCopy ,$scope.workoutData);
                    WorkoutsSrv.setWorkout(workoutId, workoutCopy).then(function(res){
                        $scope.getWorkouts();
                    });
                });
            };

            $scope.getWorkoutData = function(){
                var workoutId = $scope.workoutIdToRetrieveData;
                WorkoutsSrv.getWorkoutData(workoutId).then(function(workoutData){
                    workoutData.exerciseProm.then(function(exerciseContent){
                        $scope.exerciseContent = exerciseContent;
                    });
                });
            };
        });
})(angular);
