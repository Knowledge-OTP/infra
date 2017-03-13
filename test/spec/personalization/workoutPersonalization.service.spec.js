/* eslint no-undef: 0 */
xdescribe('testing service "PersonalizationService":', function () {
    beforeEach(module('znk.infra.personalization', 'content.mock', 'znk.infra.stats', 'storage.mock', 'categories.mock', 'user.mock', 'htmlTemplates', 'testUtility', 'env.mock'));

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

    var $rootScope, ExerciseResultSrv, ExerciseStatusEnum, WorkoutPersonalizationService, $$testAdapter, adapter,
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
        var level1 = {
            id_0: {//weakness: 0.24
                id: 0,
                totalQuestions: 25,
                correct: 15,
                unanswered: 4,
                wrong: 6,
                totalTime: 0
            },
            id_1: {//weakness: 0.24
                id: 1,
                totalQuestions: 79,
                correct: 65,
                unanswered: 5,
                wrong: 9,
                totalTime: 0
            },
            id_2: {//weakness 0.41
                id: 2,
                totalQuestions: 29,
                correct: 14,
                unanswered: 3,
                wrong: 12,
                totalTime: 0
            }
        };

        var level2 = {
            id_263: {//weakness: 0.24
                id: 263,
                subjectId: 0,
                totalQuestions: 25,
                correct: 15,
                unanswered: 4,
                wrong: 6,
                totalTime: 0,
                parentsIds: [0]
            },
            id_266: {//weakness 0.076
                id: 266,
                subjectId: 1,
                totalQuestions: 66,
                correct: 57,
                unanswered: 4,
                wrong: 5,
                totalTime: 0,
                parentsIds: [1]
            },
            id_267: {//weakness 0.385
                id: 267,
                subjectId: 1,
                totalQuestions: 13,
                correct: 8,
                unanswered: 1,
                wrong: 4,
                totalTime: 0,
                parentsIds: [1]
            },
            id_271: {//weakness 0.517
                id: 271,
                subjectId: 2,
                totalQuestions: 29,
                correct: 14,
                unanswered: 3,
                wrong: 12,
                totalTime: 0,
                parentsIds: [2]
            }
        };

        var level3 = {
            id_20: {//weakness 0.6
                id: 20,
                subjectId: 0,
                totalQuestions: 10,
                correct: 4,
                unanswered: 2,
                wrong: 4,
                totalTime: 0,
                parentsIds: [263, 0]
            },
            id_23: {//weakness 0.266
                id: 23,
                subjectId: 0,
                totalQuestions: 15,
                correct: 11,
                unanswered: 2,
                wrong: 2,
                totalTime: 0,
                parentsIds: [263, 0]
            },
            id_75: {//weakness 0.121
                id: 75,
                subjectId: 1,
                totalQuestions: 33,
                correct: 29,
                unanswered: 2,
                wrong: 2,
                totalTime: 0,
                parentsIds: [266, 1]
            },
            id_76: {//weakness 0.151
                id: 76,
                subjectId: 1,
                totalQuestions: 33,
                correct: 28,
                unanswered: 2,
                wrong: 3,
                totalTime: 0,
                parentsIds: [266, 1]
            },
            id_85: {//weakness 0.385
                id: 85,
                subjectId: 1,
                totalQuestions: 13,
                correct: 8,
                unanswered: 1,
                wrong: 4,
                totalTime: 0,
                parentsIds: [267, 1]
            },
            id_93: {//weakness 0.517
                id: 93,
                subjectId: 2,
                totalQuestions: 29,
                correct: 14,
                unanswered: 3,
                wrong: 12,
                totalTime: 0,
                parentsIds: [271, 2]
            }
        };

        _setUserStats([level1, level2, level3]);
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
