describe('testing service "StatsEventsHandlerSrv":', function () {
    'use strict';

    beforeEach(module('znk.infra.stats', 'znk.infra.utility', 'htmlTemplates', 'storage.mock', 'testUtility',
        'content.mock'));

    var $rootScope, exerciseEventsConst, TestUtilitySrv, StudentStorage, StatsEventsHandlerSrv, ExerciseTypeEnum;
    beforeEach(inject([
        '$injector',
        function ($injector) {
            $rootScope = $injector.get('$rootScope');

            exerciseEventsConst = $injector.get('exerciseEventsConst');

            TestUtilitySrv = $injector.get('TestUtilitySrv');

            var InfraConfigSrv = $injector.get('InfraConfigSrv');
            StudentStorage = TestUtilitySrv.general.asyncToSync(InfraConfigSrv.getStudentStorage, InfraConfigSrv)();

            TestUtilitySrv.general.printDebugLogs();

            StatsEventsHandlerSrv = $injector.get('StatsEventsHandlerSrv');

            ExerciseTypeEnum = $injector.get('ExerciseTypeEnum');
        }]));

    var actions = {};

    actions.getCategoryParent = function (categoryId) {
        for (var i in content.category) {
            var category = content.category[i];
            if (+category.id === +categoryId) {
                return category.parentId;
            }
        }
    };

    it('when exercise is finished then all its results should be recorded once', function () {
        var exerciseMock = content.game10;

        var TOTAL_CORRECT = 2;
        var TOTAL_UNANSWERED = 2;
        var resultMock = TestUtilitySrv.exercise.mockExerciseResult(exerciseMock, TOTAL_CORRECT, TOTAL_UNANSWERED, true);

        var expectedLevel1Stats = {
            id_1: {
                id: 1,
                correct: 2,
                wrong: 11,
                unanswered: 2,
                totalQuestions: 15
            }
        };

        var expectedLevel2Stats = {
            id_266: {
                id: 266,
                correct: 2,
                wrong: 11,
                unanswered: 2,
                totalQuestions: 15,
                parentsIds: [1]
            }
        };

        var expectedLevel3Stats = {
            id_275: {
                id: 275,
                correct: 0,
                wrong: 5,
                unanswered: 0,
                totalQuestions: 5,
                parentsIds: [266, 1]
            },
            id_276: {
                id: 276,
                correct: 1,
                wrong: 2,
                unanswered: 0,
                totalQuestions: 3,
                parentsIds: [266, 1]
            },
            id_277: {
                id: 277,
                correct: 1,
                wrong: 1,
                unanswered: 1,
                totalQuestions: 3,
                parentsIds: [266, 1]
            },
            id_278: {
                id: 278,
                correct: 0,
                wrong: 2,
                unanswered: 1,
                totalQuestions: 3,
                parentsIds: [266, 1]
            },
            id_279: {
                id: 279,
                correct: 0,
                wrong: 1,
                unanswered: 0,
                totalQuestions: 1,
                parentsIds: [266, 1]
            }
        };

        var expectedLevel4Stats = {
            id_316: {
                id: 316,
                correct: 0,
                wrong: 2,
                unanswered: 0,
                totalQuestions: 2,
                parentsIds: [275, 266, 1]
            },
            id_318: {
                id: 318,
                correct: 0,
                wrong: 1,
                unanswered: 0,
                totalQuestions: 1,
                parentsIds: [275, 266, 1]
            },
            id_319: {
                id: 319,
                correct: 0,
                wrong: 1,
                unanswered: 0,
                totalQuestions: 1,
                parentsIds: [275, 266, 1]
            },
            id_321: {
                id: 321,
                correct: 0,
                wrong: 1,
                unanswered: 0,
                totalQuestions: 1,
                parentsIds: [275, 266, 1]
            },
            id_322: {
                id: 322,
                correct: 0,
                wrong: 1,
                unanswered: 0,
                totalQuestions: 1,
                parentsIds: [276, 266, 1]
            },
            id_323: {
                id: 323,
                correct: 0,
                wrong: 1,
                unanswered: 0,
                totalQuestions: 1,
                parentsIds: [276, 266, 1]
            },
            id_324: {
                id: 324,
                correct: 1,
                wrong: 0,
                unanswered: 0,
                totalQuestions: 1,
                parentsIds: [276, 266, 1]
            },
            id_325: {
                id: 325,
                correct: 1,
                wrong: 1,
                unanswered: 1,
                totalQuestions: 3,
                parentsIds: [277, 266, 1]
            },
            id_326: {
                id: 326,
                correct: 0,
                wrong: 2,
                unanswered: 1,
                totalQuestions: 3,
                parentsIds: [278, 266, 1]
            },
            id_328: {
                id: 328,
                correct: 0,
                wrong: 1,
                unanswered: 0,
                totalQuestions: 1,
                parentsIds: [279, 266, 1]
            }
        };

        StatsEventsHandlerSrv.addNewExerciseResult(ExerciseTypeEnum.TUTORIAL.enum, exerciseMock, resultMock);
        $rootScope.$digest();

        StatsEventsHandlerSrv.addNewExerciseResult(ExerciseTypeEnum.TUTORIAL.enum, exerciseMock, resultMock);
        $rootScope.$digest();

        angular.forEach(expectedLevel4Stats, function (expectedResult, key) {
            var value = StudentStorage.adapter.__db.users.$$uid.stats.level4Categories[key];
            expect(value).toEqual(jasmine.objectContaining(expectedResult));
        });

        angular.forEach(expectedLevel3Stats, function (expectedResult, key) {
            var value = StudentStorage.adapter.__db.users.$$uid.stats.level3Categories[key];
            expect(value).toEqual(jasmine.objectContaining(expectedResult));
        });

        angular.forEach(expectedLevel2Stats, function (expectedResult, key) {
            var value = StudentStorage.adapter.__db.users.$$uid.stats.level2Categories[key];
            expect(value).toEqual(jasmine.objectContaining(expectedResult));
        });

        angular.forEach(expectedLevel1Stats, function (expectedResult, key) {
            var value = StudentStorage.adapter.__db.users.$$uid.stats.level1Categories[key];
            expect(value).toEqual(jasmine.objectContaining(expectedResult));
        });
    });
});
