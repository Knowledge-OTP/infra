(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseUtility').service('WorkoutsSrv',
        function (ExerciseStatusEnum, ExerciseTypeEnum, $log, StorageSrv, ExerciseResultSrv, ContentAvailSrv, $q,
                  InfraConfigSrv, BaseExerciseGetterSrv) {
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
                        return workoutsArr;
                    });
                });
            };

            this.getWorkoutData = function (workoutId) {
                if (angular.isUndefined(workoutId)) {
                    $log.error('workoutSrv: getWorkoutData function was invoked without workout id');
                }
                return _getWorkout(workoutId).then(function (workout) {
                    if (workout) {
                        var getExerciseProm;
                        var exerciseTypeVal = ExerciseTypeEnum.getValByEnum(workout.exerciseTypeId);
                        switch (workout.exerciseTypeId) {
                            case ExerciseTypeEnum.TUTORIAL.enum:
                                getExerciseProm = TutorialSrv.getTutorial(workout.exerciseId);
                                break;
                            case ExerciseTypeEnum.PRACTICE.enum:
                                getExerciseProm = PracticeSrv.getPractice(workout.exerciseId);
                                break;
                            default:
                                getExerciseProm = TutorialSrv.getTutorial(workout.exerciseId);
                                break;
                        }

                        return {
                            workoutId: workoutId,
                            exerciseTypeId: workout.exerciseTypeId,
                            exerciseProm: getExerciseProm,
                            exerciseResultProm: ExerciseResultSrv.getExerciseResult(workout.exerciseTypeId, workout.exerciseId)
                        };
                    }
                    return null;
                });
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
        }
    );
})(angular);
