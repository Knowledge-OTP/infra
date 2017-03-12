/* eslint no-undef: 0 */
describe('testing service "PersonalizationService":', function () {
    beforeEach(module('znk.infra.personalization', 'znk.infra.stats', 'storage.mock', 'categories.mock', 'user.mock','htmlTemplates','testUtility', 'env.mock'));

    // beforeEach(angular.mock.module('pascalprecht.translate', function ($translateProvider) {
    //     $translateProvider.translations('en', {});
    // }));

    var workoutsArr = [];

    // beforeEach(angular.mock.module(function ($provide) {
    //     $provide.decorator('WorkoutsSrv', function ($delegate, $q) {
    //         $delegate.getAllWorkouts = function () {
    //             return $q.when(workoutsArr);
    //         };
    //         return $delegate;
    //     });
    //
    //     $provide.decorator('WorkoutPersonalizationServiceUtil', function ($delegate, ExerciseTypeEnum) {
    //         $delegate.subjectsArr = [1, 2, 5];
    //         $delegate.exerciseTypeKeysMap = {
    //             timePreferenceDrill: ExerciseTypeEnum.DRILL.enum,
    //             timePreferenceGame: ExerciseTypeEnum.GAME.enum
    //         };
    //         return $delegate;
    //     });
    // }));

    var $rootScope, ExerciseResultSrv, ExerciseStatusEnum, WorkoutPersonalizationService,$$testAdapter,adapter,
        StorageFirebaseAdapter, ExerciseTypeEnum, db, userStats, actions; //eslint-disable-line

    beforeEach(inject([
        '$injector',
        function ($injector) {
            $rootScope = $injector.get('$rootScope');
            WorkoutPersonalizationService = $injector.get('PersonalizationSrv');
          //  StorageFirebaseAdapter = $injector.get('StorageFirebaseAdapter');
            ExerciseResultSrv = $injector.get('ExerciseResultSrv');
            ExerciseStatusEnum = $injector.get('ExerciseStatusEnum');
            ExerciseTypeEnum = $injector.get('ExerciseTypeEnum');
            $$testAdapter = $injector.get('$$testAdapter');
            StorageFirebaseAdapter = new $$testAdapter();

            actions = {};

            actions.addExerciseStatus = function (exerciseTypeId, exerciseId) {
                var exercisesStatus;
                ExerciseResultSrv.getExercisesStatusMap().then(function (_exercisesStatus) {
                    exercisesStatus = _exercisesStatus;
                });
                $rootScope.$digest();

                if (!exercisesStatus[exerciseTypeId]) {
                    exercisesStatus[exerciseTypeId] = {};
                }

                exercisesStatus[exerciseTypeId][exerciseId] = {
                    status: ExerciseStatusEnum.COMPLETED.enum
                };
            };

            actions.setWorkouts = function (workoutsSubjectsArr) {
                workoutsArr = workoutsSubjectsArr.map(function (subjectId, index) {
                    return {
                        workoutOrder: index + 1,
                        subjectId: subjectId || 1
                    };
                });
            };

            actions.addWorkouts = function (workoutsSubjectsArr) {
                workoutsArr = workoutsArr.concat(workoutsSubjectsArr);
            };

            actions.getPersonalizedExercise = function (subjectsToIgnore, workoutOrder) {
                var val;
                WorkoutPersonalizationService.getPersonalizedExercise(subjectsToIgnore, workoutOrder).then(function (_val) {
                    val = _val;
                });
                $rootScope.$digest();
                return val;
            };

            actions.getAllAvailExercises = function () {
                var val;
                WorkoutPersonalizationService.getAllAvailExercisesByGeneralCategoryOnly().then(function (_val) {
                    val = _val;
                });
                $rootScope.$digest();
                return val;
            };
        }]));

    beforeEach(function () {
        StorageFirebaseAdapter.__db.users.$$uid.workouts = {};//eslint-disable-line
        StorageFirebaseAdapter.__db.users.$$uid.stats = {};//eslint-disable-line

        db = StorageFirebaseAdapter.__db;
        userStats = StorageFirebaseAdapter.__db.users.$$uid.stats;//eslint-disable-line
    });

    function _setUserStats(levelsArr) {
        levelsArr.forEach(function (levelStats, index) {//eslint-disable-line
            var key = 'level' + (index + 1) + 'Categories';
            userStats[key] = levelStats;
        });
    }

    beforeEach(function () {
        var level1Stats = {
            "id_0": {
                "correct": 9,
                "id": 0,
                "totalQuestions": 25,
                "totalTime": 19581,
                "unanswered": 0,
                "wrong": 16
            },
            "id_7": {
                "correct": 10,
                "id": 7,
                "totalQuestions": 20,
                "totalTime": 25405,
                "unanswered": 0,
                "wrong": 10
            }
        };

        var level2Stats = {
            "id_10": {
                "correct": 6,
                "id": 10,
                "parentsIds": [7],
                "totalQuestions": 12,
                "totalTime": 18687,
                "unanswered": 0,
                "wrong": 6
            },
            "id_11": {
                "correct": 4,
                "id": 11,
                "parentsIds": [7],
                "totalQuestions": 8,
                "totalTime": 6718,
                "unanswered": 0,
                "wrong": 4
            },
            "id_9": {
                "correct": 9,
                "id": 9,
                "parentsIds": [0],
                "totalQuestions": 25,
                "totalTime": 19581,
                "unanswered": 0,
                "wrong": 16
            }
        };

        var level3Stats = {
            "id_13": {
                "correct": 4,
                "id": 13,
                "parentsIds": [9, 0],
                "totalQuestions": 13,
                "totalTime": 11783,
                "unanswered": 0,
                "wrong": 9
            },
            "id_14": {
                "correct": 3,
                "id": 14,
                "parentsIds": [9, 0],
                "totalQuestions": 8,
                "totalTime": 5634,
                "unanswered": 0,
                "wrong": 5
            },
            "id_17": {
                "correct": 2,
                "id": 17,
                "parentsIds": [9, 0],
                "totalQuestions": 4,
                "totalTime": 2164,
                "unanswered": 0,
                "wrong": 2
            },
            "id_19": {
                "correct": 3,
                "id": 19,
                "parentsIds": [10, 7],
                "totalQuestions": 9,
                "totalTime": 16899,
                "unanswered": 0,
                "wrong": 6
            },
            "id_20": {
                "correct": 3,
                "id": 20,
                "parentsIds": [10, 7],
                "totalQuestions": 3,
                "totalTime": 1788,
                "unanswered": 0,
                "wrong": 0
            },
            "id_22": {
                "correct": 0,
                "id": 22,
                "parentsIds": [11, 7],
                "totalQuestions": 2,
                "totalTime": 728,
                "unanswered": 0,
                "wrong": 2
            },
            "id_23": {
                "correct": 0,
                "id": 23,
                "parentsIds": [11, 7],
                "totalQuestions": 2,
                "totalTime": 2090,
                "unanswered": 0,
                "wrong": 2
            },
            "id_26": {
                "correct": 2,
                "id": 26,
                "parentsIds": [11, 7],
                "totalQuestions": 2,
                "totalTime": 2328,
                "unanswered": 0,
                "wrong": 0
            },
            "id_27": {
                "correct": 2,
                "id": 27,
                "parentsIds": [11, 7],
                "totalQuestions": 2,
                "totalTime": 1572,
                "unanswered": 0,
                "wrong": 0
            }
        };

        var level4Stats = {
            "id_108": {
                "correct": 2,
                "id": 108,
                "parentsIds": [26, 11, 7],
                "totalQuestions": 2,
                "totalTime": 2328,
                "unanswered": 0,
                "wrong": 0
            },
            "id_111": {
                "correct": 2,
                "id": 111,
                "parentsIds": [27, 11, 7],
                "totalQuestions": 2,
                "totalTime": 1572,
                "unanswered": 0,
                "wrong": 0
            },
            "id_35": {
                "correct": 0,
                "id": 35,
                "parentsIds": [13, 9, 0],
                "totalQuestions": 1,
                "totalTime": 1999,
                "unanswered": 0,
                "wrong": 1
            },
            "id_39": {
                "correct": 0,
                "id": 39,
                "parentsIds": [13, 9, 0],
                "totalQuestions": 1,
                "totalTime": 538,
                "unanswered": 0,
                "wrong": 1
            },
            "id_40": {
                "correct": 2,
                "id": 40,
                "parentsIds": [13, 9, 0],
                "totalQuestions": 2,
                "totalTime": 1666,
                "unanswered": 0,
                "wrong": 0
            },
            "id_46": {
                "correct": 0,
                "id": 46,
                "parentsIds": [13, 9, 0],
                "totalQuestions": 3,
                "totalTime": 3588,
                "unanswered": 0,
                "wrong": 3
            },
            "id_49": {
                "correct": 2,
                "id": 49,
                "parentsIds": [13, 9, 0],
                "totalQuestions": 6,
                "totalTime": 3992,
                "unanswered": 0,
                "wrong": 4
            },
            "id_52": {
                "correct": 3,
                "id": 52,
                "parentsIds": [14, 9, 0],
                "totalQuestions": 3,
                "totalTime": 2880,
                "unanswered": 0,
                "wrong": 0
            },
            "id_54": {
                "correct": 0,
                "id": 54,
                "parentsIds": [14, 9, 0],
                "totalQuestions": 3,
                "totalTime": 975,
                "unanswered": 0,
                "wrong": 3
            },
            "id_58": {
                "correct": 0,
                "id": 58,
                "parentsIds": [14, 9, 0],
                "totalQuestions": 1,
                "totalTime": 1172,
                "unanswered": 0,
                "wrong": 1
            },
            "id_62": {
                "correct": 0,
                "id": 62,
                "parentsIds": [14, 9, 0],
                "totalQuestions": 1,
                "totalTime": 607,
                "unanswered": 0,
                "wrong": 1
            },
            "id_70": {
                "correct": 0,
                "id": 70,
                "parentsIds": [17, 9, 0],
                "totalQuestions": 2,
                "totalTime": 1418,
                "unanswered": 0,
                "wrong": 2
            },
            "id_71": {
                "correct": 2,
                "id": 71,
                "parentsIds": [17, 9, 0],
                "totalQuestions": 2,
                "totalTime": 746,
                "unanswered": 0,
                "wrong": 0
            },
            "id_73": {
                "correct": 3,
                "id": 73,
                "parentsIds": [19, 10, 7],
                "totalQuestions": 3,
                "totalTime": 12990,
                "unanswered": 0,
                "wrong": 0
            },
            "id_76": {
                "correct": 0,
                "id": 76,
                "parentsIds": [19, 10, 7],
                "totalQuestions": 3,
                "totalTime": 2595,
                "unanswered": 0,
                "wrong": 3
            },
            "id_83": {
                "correct": 0,
                "id": 83,
                "parentsIds": [19, 10, 7],
                "totalQuestions": 3,
                "totalTime": 1314,
                "unanswered": 0,
                "wrong": 3
            },
            "id_85": {
                "correct": 3,
                "id": 85,
                "parentsIds": [20, 10, 7],
                "totalQuestions": 3,
                "totalTime": 1788,
                "unanswered": 0,
                "wrong": 0
            },
            "id_95": {
                "correct": 0,
                "id": 95,
                "parentsIds": [22, 11, 7],
                "totalQuestions": 2,
                "totalTime": 728,
                "unanswered": 0,
                "wrong": 2
            },
            "id_97": {
                "correct": 0,
                "id": 97,
                "parentsIds": [23, 11, 7],
                "totalQuestions": 2,
                "totalTime": 2090,
                "unanswered": 0,
                "wrong": 2
            }
        }

        _setUserStats([level1Stats, level2Stats, level3Stats, level4Stats]);
    });

    it('when call getAllAvailExercisesByGeneralCategoryOnly with exercise drill100 completed it should return all ' +
        'exercise with general category except exercise drill100', function () {
        var exerciseDrillId = 100;
        var exerciseTypeDrill = 5;
        var categoryId = 266;
        actions.addExerciseStatus(5, exerciseDrillId);
        var resultProm = WorkoutPersonalizationService.getAvailableExercises();
        resultProm.then(function (availableExercises) {
            var resultCategory = availableExercises.availableCategories[exerciseTypeDrill][categoryId];
            expect(resultCategory).not.toContain(exerciseDrillId);
        });
        $rootScope.$digest();
    });

    it('when call getWeakestAvailGeneralCategory then expect to get the weakest avail general category: 266', function () {
        var expectedWeakestAvailGeneralCategory = 266;

        // availableExercises, availableStats, exerciseTypesToIgnore, currCategoryHierarchy
        var resultProm = WorkoutPersonalizationService.getExerciseForTimeAndSubjectByWeakestCategory();
        resultProm.then(function (result) {
            expect(result.id).toEqual(expectedWeakestAvailGeneralCategory);
        });
        $rootScope.$digest();
    });

    it('when call getWeakestAvailGeneralCategory and exclude subject 1 then expect to get the second weakest avail general category: 267', function () {
        var expectedWeakestAvailGeneralCategory = 267;
        var resultProm = WorkoutPersonalizationService.getWeakestAvailGeneralCategory([1]);
        resultProm.then(function (result) {
            expect(result.id).toEqual(expectedWeakestAvailGeneralCategory);
        });
        $rootScope.$digest();
    });

    it('when call selectWorkoutSubject with workoutOrder 5 then it should get the weakest avail general category of any subject', function () {
        var expectedWeakestAvailGeneralCategory = 266;
        var resultProm = WorkoutPersonalizationService.selectWorkoutSubjectByWorkoutOrder([], 5);
        resultProm.then(function (result) {
            expect(result.id).toEqual(expectedWeakestAvailGeneralCategory);
        });
        $rootScope.$digest();
    });


    it('when call selectWorkoutSubject with workoutOrder 6 and all subjects been used in the 5 prev workouts then ' +
        'look for the subject with the weakest general category', function () {
        var expectedWeakestAvailGeneralCategory = 266;
        actions.setWorkouts([1, 2, 5, 1, 2]);
        var resultProm = WorkoutPersonalizationService.selectWorkoutSubjectByWorkoutOrder([], 6);
        resultProm.then(function (result) {
            expect(result.id).toEqual(expectedWeakestAvailGeneralCategory);
        });
        $rootScope.$digest();
    });

    it('when call selectWorkoutSubject with workoutOrder 6 and one subject was not been used in the 5 prev workouts then ' +
        'get the subject that was not been used', function () {
        var expectedWeakestAvailGeneralCategory = 268;
        actions.setWorkouts([1, 1, 1, 2, 2]);
        var resultProm = WorkoutPersonalizationService.selectWorkoutSubjectByWorkoutOrder([], 6);
        resultProm.then(function (result) {
            expect(result.id).toEqual(expectedWeakestAvailGeneralCategory);
        });
        $rootScope.$digest();
    });

    it('when call selectWorkoutSubject with workoutOrder 6 and more then one subject was not been used in the 5 prev workouts then ' +
        'look for the subject with the weakest general category', function () {
        var expectedWeakestAvailGeneralCategory = 267; //  weakest general category for weakest subject (2)
        actions.setWorkouts([1, 1, 1, 1, 1]);
        var resultProm = WorkoutPersonalizationService.selectWorkoutSubjectByWorkoutOrder([], 6);
        resultProm.then(function (result) {
            expect(result.id).toEqual(expectedWeakestAvailGeneralCategory);
        });
        $rootScope.$digest();
    });

    it('when call getPersonalizedExercise then should get an object with time bundle props: 5, 10, 15 with exercise object on each one', function () {
        var resultProm = WorkoutPersonalizationService.getPersonalizedExercise([], 1);

        var expectedResult = {
            categoryId: 266,
            subjectId: 1
        };
        var availExercises = actions.getAllAvailExercises();
        resultProm.then(function (result) {
            // Looking for Practices / Drills (3 / 5)
            var availCategoryArr = availExercises[3][expectedResult.categoryId].concat(availExercises[5][expectedResult.categoryId]);

            expect(result[5]).toEqual(jasmine.objectContaining(expectedResult));
            expect(result[10]).toEqual(jasmine.objectContaining(expectedResult));
            expect(result[15]).toEqual(jasmine.objectContaining(expectedResult));
            // exerciseId is random
            expect(availCategoryArr).toContain(result[5].exerciseId);
            expect(availCategoryArr).toContain(result[10].exerciseId);
            expect(availCategoryArr).toContain(result[15].exerciseId);
        });
        $rootScope.$digest();
    });


    it('when call getPersonalizedExercise with all subject time exercises finish then should get an object with ' +
        'time bundle props: 10, 15 with exercise object on each one', function () {
        actions.addExerciseStatus(5, 100);
        actions.addExerciseStatus(5, 101);
        actions.addExerciseStatus(3, 200);
        actions.addExerciseStatus(3, 201);

        var usedExercises = [100, 101, 200, 201];

        var resultProm = WorkoutPersonalizationService.getPersonalizedExercise([], 1);

        var availExercises = actions.getAllAvailExercises();

        var expectedResult = {
            categoryId: 266,
            subjectId: 1
        };

        resultProm.then(function (result) {
            // Looking for Practices / Drills (3 / 5)
            var availCategoryArr = availExercises[3][expectedResult.categoryId].concat(availExercises[5][expectedResult.categoryId]);
            expect(result[10]).toEqual(jasmine.objectContaining(expectedResult));
            expect(result[15]).toEqual(jasmine.objectContaining(expectedResult));

            expect(usedExercises).not.toContain(availExercises);
            expect(availCategoryArr).toContain(result[10].exerciseId);
            expect(availCategoryArr).toContain(result[15].exerciseId);
        });

        $rootScope.$digest();
    });

    it('when no stats were recorded then random category should be selected and workout time preference +' +
        'should be generated ', function () {
        actions.setWorkouts([]);
        var workouts = StorageFirebaseAdapter.__db.users.$$uid.workouts.workouts;//eslint-disable-line
        var drillArr = [
            100, 101, 109, 110, 118, 122, 123, 124, 103, 105, 115, 130, 134, 106,
            120, 138, 140
        ];

        var gameArr = [
            200, 201, 210, 212, 250, 251, 204, 217, 220, 255, 260, 207, 230, 240,
            261, 265
        ];

        var totalExercisesNum = drillArr.length + gameArr.length;
        var usedExercisesMap = {};
        for (var i = 0; i < totalExercisesNum; i++) {
            var index = i + 1;
            var exercisesByTime = actions.getPersonalizedExercise([], index);
            var keys = Object.keys(exercisesByTime);

            (function () {//eslint-disable-line
                for (var i in keys) {//eslint-disable-line
                    var key = keys[i];
                    var exercise = exercisesByTime[key];
                    if (exercise) {
                        actions.addExerciseStatus(exercise.exerciseTypeId, exercise.exerciseId);
                        actions.addWorkouts([{
                            workoutOrder: index,
                            subjectId: exercise.subjectId
                        }]);
                        if (!usedExercisesMap[exercise.exerciseTypeId]) {
                            usedExercisesMap[exercise.exerciseTypeId] = [];
                        }
                        usedExercisesMap[exercise.exerciseTypeId].push(exercise.exerciseId);
                        break;
                    }
                }
            })();
        }

        expect(usedExercisesMap[ExerciseTypeEnum.DRILL.enum].sort()).toEqual(drillArr.sort());
        expect(usedExercisesMap[ExerciseTypeEnum.GAME.enum].sort()).toEqual(gameArr.sort());
    });
});
