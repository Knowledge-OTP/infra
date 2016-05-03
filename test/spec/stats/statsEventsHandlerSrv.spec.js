describe('testing service "StatsEventsHandlerSrv":', function () {
    'use strict';

    beforeEach(module('znk.infra.stats', 'znk.infra.utility', 'htmlTemplates', 'storage.mock', 'testUtility'));

    beforeEach(module(function (StatsSrvProvider) {
        function getCategoryLookup($q, UtilitySrv) {
            return $q.when(UtilitySrv.array.convertToMap(content.category));
        }

        StatsSrvProvider.setCategoryLookup(getCategoryLookup);
    }));

    var $rootScope, exerciseEventsConst, TestUtilitySrv, testStorage, StatsEventsHandlerSrv, ExerciseTypeEnum;
    beforeEach(inject([
        '$injector',
        function ($injector) {
            $rootScope = $injector.get('$rootScope');
            exerciseEventsConst = $injector.get('exerciseEventsConst');
            testStorage = $injector.get('testStorage');
            TestUtilitySrv = $injector.get('TestUtilitySrv');
            TestUtilitySrv.general.printDebugLogs();
            StatsEventsHandlerSrv = $injector.get('StatsEventsHandlerSrv');
            ExerciseTypeEnum = $injector.get('ExerciseTypeEnum');
        }]));

    var actions = {};
    actions.updateStat = function (stat, totalQuestions, correct, unanswered, id, subjectId, generalCategoryId) {
        if (angular.isDefined(id)) {
            stat.id = id;
        }

        if (angular.isDefined(subjectId)) {
            stat.subjectId = subjectId;
        }

        if (angular.isDefined(generalCategoryId)) {
            stat.generalCategoryId = generalCategoryId;
        }

        if (angular.isUndefined(stat.totalQuestions)) {
            stat.totalQuestions = 5;
        }
        stat.totalQuestions += totalQuestions;

        if (angular.isUndefined(stat.correct)) {
            stat.correct = 1;

        }
        stat.correct += correct;

        if (angular.isUndefined(stat.unanswered)) {
            stat.unanswered = 0;
        }
        stat.unanswered += unanswered;

        if (angular.isUndefined(stat.wrong)) {
            stat.wrong = 4;

        }
        stat.wrong += totalQuestions - correct - unanswered;

        stat.totalTime = 0;
        return stat;
    };

    actions.getCategoryParent = function (categoryId) {
        for (var i in content.category) {
            var category = content.category[i];
            if (+category.id === +categoryId) {
                return category.parentId;
            }
        }
    };

    actions.updateAllStats = function (specificStats, generalStats, subjectStats, totalQuestions, correct, unanswered, specificCategoryId) {
        var generalCategoryId = actions.getCategoryParent(specificCategoryId);
        var subjectId = actions.getCategoryParent(generalCategoryId);

        if (!specificStats[specificCategoryId]) {
            specificStats[specificCategoryId] = {};
        }

        if (!generalStats[generalCategoryId]) {
            generalStats[generalCategoryId] = {};
        }

        if (!subjectStats[subjectId]) {
            subjectStats[subjectId] = {};
        }

        actions.updateStat(specificStats[specificCategoryId], totalQuestions, correct, unanswered, specificCategoryId, subjectId, generalCategoryId);
        actions.updateStat(generalStats[generalCategoryId], totalQuestions, correct, unanswered, generalCategoryId, subjectId);
        actions.updateStat(subjectStats[subjectId], totalQuestions, correct, unanswered, subjectId);
    };

    it('when exercise is finished then all its results should be recorded once', function () {
        var exerciseMock = content.game10;

        var TOTAL_CORRECT = 2;
        var TOTAL_UNANSWERED = 2;
        var resultMock = TestUtilitySrv.exercise.mockExerciseResult(exerciseMock, TOTAL_CORRECT, TOTAL_UNANSWERED, true);

        var expectedLevel1Stats = {
            id_1: {
                id: 1,
                correct: 3,
                wrong: 15,
                unanswered: 2,
                totalQuestions: 20
            }
        };

        var expectedLevel2Stats = {
            id_266: {
                id: 266,
                correct: 3,
                wrong: 15,
                unanswered: 2,
                totalQuestions: 20,
                parentsIds: [1]
            }
        };

        var expectedLevel3Stats = {
            id_275: {
                id: 275,
                correct: 1,
                wrong: 9,
                unanswered: 0,
                totalQuestions: 10,
                parentsIds: [266, 1]
            },
            id_276: {
                id: 276,
                correct: 2,
                wrong: 6,
                unanswered: 0,
                totalQuestions: 8,
                parentsIds: [266, 1]
            },
            id_277: {
                id: 277,
                correct: 2,
                wrong: 5,
                unanswered: 1,
                totalQuestions: 8,
                parentsIds: [266, 1]
            },
            id_278: {
                id: 278,
                correct: 1,
                wrong: 6,
                unanswered: 1,
                totalQuestions: 8,
                parentsIds: [266, 1]
            },
            id_279: {
                id: 279,
                correct: 1,
                wrong: 5,
                unanswered: 0,
                totalQuestions: 6,
                parentsIds: [266, 1]
            }
        };

        var expectedLevel4Stats = {
            id_316: {
                id: 316,
                correct: 1,
                wrong: 6,
                unanswered: 0,
                totalQuestions: 7,
                parentsIds: [275, 266, 1]
            },
            id_318: {
                id: 318,
                correct: 1,
                wrong: 5,
                unanswered: 0,
                totalQuestions: 6,
                parentsIds: [275, 266, 1]
            },
            id_319: {
                id: 319,
                correct: 1,
                wrong: 5,
                unanswered: 0,
                totalQuestions: 6,
                parentsIds: [275, 266, 1]
            },
            id_321: {
                id: 321,
                correct: 1,
                wrong: 5,
                unanswered: 0,
                totalQuestions: 6,
                parentsIds: [275, 266, 1]
            },
            id_322: {
                id: 322,
                correct: 1,
                wrong: 5,
                unanswered: 0,
                totalQuestions: 6,
                parentsIds: [276, 266, 1]
            },
            id_323: {
                id: 323,
                correct: 1,
                wrong: 5,
                unanswered: 0,
                totalQuestions: 6,
                parentsIds: [276, 266, 1]
            },
            id_324: {
                id: 324,
                correct: 2,
                wrong: 4,
                unanswered: 0,
                totalQuestions: 6,
                parentsIds: [276, 266, 1]
            },
            id_325: {
                id: 325,
                correct: 2,
                wrong: 5,
                unanswered: 1,
                totalQuestions: 8,
                parentsIds: [277, 266, 1]
            },
            id_326: {
                id: 326,
                correct: 1,
                wrong: 6,
                unanswered: 1,
                totalQuestions: 8,
                parentsIds: [278, 266, 1]
            },
            id_328: {
                id: 328,
                correct: 1,
                wrong: 5,
                unanswered: 0,
                totalQuestions: 6,
                parentsIds: [279, 266, 1]
            }
        };

        StatsEventsHandlerSrv.addNewExerciseResult(ExerciseTypeEnum.TUTORIAL.enum, exerciseMock, resultMock);
        $rootScope.$digest();

        StatsEventsHandlerSrv.addNewExerciseResult(ExerciseTypeEnum.TUTORIAL.enum, exerciseMock, resultMock);
        $rootScope.$digest();

        angular.forEach(expectedLevel4Stats,function(expectedResult, key){
            var value = testStorage.db.users.$$uid.stats.level4Categories[key];
            expect(value).toEqual(jasmine.objectContaining(expectedResult));
        });

        angular.forEach(expectedLevel3Stats,function(expectedResult, key){
            var value = testStorage.db.users.$$uid.stats.level3Categories[key];
            expect(value).toEqual(jasmine.objectContaining(expectedResult));
        });

        angular.forEach(expectedLevel2Stats,function(expectedResult, key){
            var value = testStorage.db.users.$$uid.stats.level2Categories[key];
            expect(value).toEqual(jasmine.objectContaining(expectedResult));
        });

        angular.forEach(expectedLevel1Stats,function(expectedResult, key){
            var value = testStorage.db.users.$$uid.stats.level1Categories[key];
            expect(value).toEqual(jasmine.objectContaining(expectedResult));
        });
    });
});
