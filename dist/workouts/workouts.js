(function (angular) {
    'use strict';

    angular.module('znk.infra.workouts', [
        'znk.infra.exerciseUtility',
        'znk.infra.config',
        'znk.infra.exerciseResult',
        'znk.infra.contentAvail'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.contentGetters').service('WorkoutsSrv',
        ["ExerciseStatusEnum", "ExerciseTypeEnum", "$log", "StorageSrv", "ExerciseResultSrv", "ContentAvailSrv", "$q", "InfraConfigSrv", function (ExerciseStatusEnum, ExerciseTypeEnum, $log, StorageSrv, ExerciseResultSrv, ContentAvailSrv, $q,
                  InfraConfigSrv) {
            'ngInject';

            var workoutsDataPath = StorageSrv.variables.appUserSpacePath + '/workouts';

            function _getWorkoutsData() {
                var defaultValue = {
                    workouts: {}
                };
                return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                    return StudentStorageSrv.get(workoutsDataPath, defaultValue);
                });
            }

            function getWorkoutKey(workoutId) {
                return 'workout_' + workoutId;
            }

            function _getWorkout(workoutId) {
                var workoutKey = getWorkoutKey(workoutId);
                return _getWorkoutsData().then(function (workoutsData) {
                    return workoutsData.workouts[workoutKey];
                });
            }

            function _setIsAvailForWorkout(workout) {
                return ContentAvailSrv.isDailyAvail(workout.workoutOrder).then(function (isAvail) {
                    workout.isAvail = isAvail;
                });
            }

            this.getAllWorkouts = function () {
                return _getWorkoutsData().then(function (workoutsData) {
                    var workoutsArr = [],
                        promArr = [];
                    angular.forEach(workoutsData.workouts, function (workout) {
                        workoutsArr.push(workout);
                        promArr.push(_setIsAvailForWorkout(workout));
                    });

                    for (var i = 0; i < 5; i++) {
                        var workoutToAdd = {
                            status: ExerciseStatusEnum.NEW.enum,
                            workoutOrder: workoutsArr.length + 1
                        };
                        workoutsArr.push(workoutToAdd);
                        promArr.push(_setIsAvailForWorkout(workoutToAdd));
                    }
                    return $q.all(promArr).then(function () {
                        return workoutsArr.sort(function (workout1, workout2) {
                            return workout1.workoutOrder - workout2.workoutOrder;
                        });
                    });
                });
            };

            this.getWorkoutData = function (workoutId) {
                if (angular.isUndefined(workoutId)) {
                    $log.error('workoutSrv: getWorkoutData function was invoked without workout id');
                }
                return _getWorkout(workoutId);
            };

            this.setWorkout = function (workoutId, newWorkoutValue) {
                return _getWorkoutsData().then(function (workoutsData) {
                    var workoutKey = getWorkoutKey(workoutId);
                    workoutsData.workouts[workoutKey] = newWorkoutValue;
                    InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                        StudentStorageSrv.set(workoutsDataPath, workoutsData);
                    });
                });
            };

            this.getWorkoutKey = getWorkoutKey;
        }]
    );
})(angular);

angular.module('znk.infra.workouts').run(['$templateCache', function($templateCache) {

}]);
