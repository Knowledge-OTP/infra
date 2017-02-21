(function (angular) {
    'use strict';

    angular.module('znk.infra.eTutoring')
        .service('ETutoringWorkoutsService', function (ExerciseTypeEnum, $log, DrillSrv,
                                                TutorialSrv, ExerciseResultSrv, $q, PracticeSrv, LectureSrv, AuthService, CategoryService, TestScoreCategoryEnum) {
            'ngInject';
            this.getWorkoutData = function (exerciseId, exerciseTypeId, moduleId) {
                if (angular.isUndefined(exerciseId) || angular.isUndefined(exerciseTypeId)) {
                    $log.error('ETutoringWorkoutsService: getWorkoutData function was invoked without exerciseId or exerciseTypeId');
                    return ($q.when(null));
                }

                var getExerciseProm,
                    exerciseResultProm;

                if (angular.isDefined(moduleId)) {
                    var authData = AuthService.getAuth();
                    if (authData) {
                        exerciseResultProm = ExerciseResultSrv.getModuleExerciseResult(authData.uid, moduleId, exerciseTypeId, exerciseId);
                    }
                } else {
                    exerciseResultProm = ExerciseResultSrv.getExerciseResult(exerciseTypeId, exerciseId);
                }

                switch (exerciseTypeId) {
                    case ExerciseTypeEnum.TUTORIAL.enum:
                        getExerciseProm = TutorialSrv.getTutorial(exerciseId);
                        break;
                    case ExerciseTypeEnum.PRACTICE.enum:
                        getExerciseProm = PracticeSrv.getPractice(exerciseId);
                        break;
                    case ExerciseTypeEnum.LECTURE.enum:
                        getExerciseProm = LectureSrv.getLecture(exerciseId);
                        break;
                    default:
                        getExerciseProm = DrillSrv.getDrill(exerciseId);
                }

                return $q.when({
                    workoutId: exerciseId,
                    exerciseTypeId: exerciseTypeId,
                    exerciseProm: getExerciseProm,
                    exerciseResultProm: exerciseResultProm
                });
            };

            this.getIconNameByCategoryId = function (categoryId) {
                return CategoryService.getCategoryLevel2Parent(categoryId).then(function (testScoreObj) {
                    switch (testScoreObj.id) {
                        case TestScoreCategoryEnum.MATH.enum:
                            return 'calculator-icon';

                        case TestScoreCategoryEnum.WRITING.enum:
                            return 'writing-icon';

                        case TestScoreCategoryEnum.READING.enum:
                            return 'reading-icon';

                        case TestScoreCategoryEnum.ESSAY.enum:
                            return 'essay-icon';
                        default:
                            break;
                    }
                });
            };

        });
})(angular);




