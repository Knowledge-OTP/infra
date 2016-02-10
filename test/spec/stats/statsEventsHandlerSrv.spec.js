describe('testing service "StatsEventsHandlerSrv":', function () {
    'use strict';

    beforeEach(module('znk.infra.stats', 'znk.infra.utility', 'htmlTemplates', 'storage.mock', 'testUtility'));

    beforeEach(module(function(StatsSrvProvider){
        function getCategoryLookup($q, UtilitySrv) {
            return $q.when(UtilitySrv.array.convertToMap(content.category));
        }
        StatsSrvProvider.setCategoryLookup(getCategoryLookup);
    }));

    var $rootScope, exerciseEventsConst, TestUtilitySrv, testStorage;
    beforeEach(inject([
        '$injector',
        function ($injector) {
            $rootScope = $injector.get('$rootScope');
            exerciseEventsConst = $injector.get('exerciseEventsConst');
            testStorage = $injector.get('testStorage');
            TestUtilitySrv = $injector.get('TestUtilitySrv');
            TestUtilitySrv.general.printDebugLogs();
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

        if(angular.isUndefined(stat.totalQuestions)) {
            stat.totalQuestions = 5;
        }
        stat.totalQuestions += totalQuestions;

        if (angular.isUndefined(stat.correct)){
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

    actions.getCategoryParent = function(categoryId){
        for(var i in content.category){
            var category = content.category[i];
            if(+category.id === +categoryId){
                return category.parentId;
            }
        }
    };

    actions.updateAllStats = function(specificStats,generalStats,subjectStats,totalQuestions,totalCorrect,totalUnanswered,specificCategoryId){
        var generalCategoryId = actions.getCategoryParent(specificCategoryId);
        var subjectId = actions.getCategoryParent(generalCategoryId);

        if(!specificStats[specificCategoryId]){
            specificStats[specificCategoryId] = {};
        }

        if(!generalStats[generalCategoryId]){
            generalStats[generalCategoryId] = {};
        }

        if(!subjectStats[subjectId]){
            subjectStats[subjectId] = {};
        }

        actions.updateStat(specificStats[specificCategoryId] , totalQuestions, totalCorrect, totalUnanswered, specificCategoryId, subjectId, generalCategoryId);
        actions.updateStat(generalStats[generalCategoryId], totalQuestions, totalCorrect, totalUnanswered, generalCategoryId, subjectId);
        actions.updateStat(subjectStats[subjectId] , totalQuestions, totalCorrect, totalUnanswered, subjectId);
    };

    it('when exercise is finished then all its results should be recorded', function () {
        var exerciseMock = content.game10;

        var TOTAL_CORRECT = 2;
        var TOTAL_UNANSWERED = 2;
        var resultMock = TestUtilitySrv.exercise.mockExerciseResult(exerciseMock, TOTAL_CORRECT, TOTAL_UNANSWERED,true);

        var expectedSpecificCategoryStats = {};
        var expectedGeneralCategoryStats = {};
        var expectedSubjectStats = {};

        $rootScope.$broadcast(exerciseEventsConst.game.FINISH, exerciseMock, resultMock);
        $rootScope.$digest();

        var totalCorrect = 1;
        var totalUnanswered = 0;
        var totalQuestions = 1;
        var specificCategoryId = 324;
        actions.updateAllStats(expectedSpecificCategoryStats, expectedGeneralCategoryStats,expectedSubjectStats,
            totalQuestions,totalCorrect,totalUnanswered,specificCategoryId);

        totalCorrect = 1;
        totalUnanswered = 1;
        totalQuestions = 3;
        specificCategoryId = 325;
        actions.updateAllStats(expectedSpecificCategoryStats, expectedGeneralCategoryStats,expectedSubjectStats,
            totalQuestions,totalCorrect,totalUnanswered,specificCategoryId);

        totalCorrect = 0;
        totalUnanswered = 1;
        totalQuestions = 3;
        specificCategoryId = 326;
        actions.updateAllStats(expectedSpecificCategoryStats, expectedGeneralCategoryStats,expectedSubjectStats,
            totalQuestions,totalCorrect,totalUnanswered,specificCategoryId);

        totalCorrect = 0;
        totalUnanswered = 0;
        totalQuestions = 1;
        specificCategoryId = 321;
        actions.updateAllStats(expectedSpecificCategoryStats, expectedGeneralCategoryStats,expectedSubjectStats,
            totalQuestions,totalCorrect,totalUnanswered,specificCategoryId);

        totalCorrect = 0;
        totalUnanswered = 0;
        totalQuestions = 1;
        specificCategoryId = 318;
        actions.updateAllStats(expectedSpecificCategoryStats, expectedGeneralCategoryStats,expectedSubjectStats,
            totalQuestions,totalCorrect,totalUnanswered,specificCategoryId);

        totalCorrect = 0;
        totalUnanswered = 0;
        totalQuestions = 1;
        specificCategoryId = 328;
        actions.updateAllStats(expectedSpecificCategoryStats, expectedGeneralCategoryStats,expectedSubjectStats,
            totalQuestions,totalCorrect,totalUnanswered,specificCategoryId);

        totalCorrect = 0;
        totalUnanswered = 0;
        totalQuestions = 1;
        specificCategoryId = 322;
        actions.updateAllStats(expectedSpecificCategoryStats, expectedGeneralCategoryStats,expectedSubjectStats,
            totalQuestions,totalCorrect,totalUnanswered,specificCategoryId);

        totalCorrect = 0;
        totalUnanswered = 0;
        totalQuestions = 1;
        specificCategoryId = 323;
        actions.updateAllStats(expectedSpecificCategoryStats, expectedGeneralCategoryStats,expectedSubjectStats,
            totalQuestions,totalCorrect,totalUnanswered,specificCategoryId);

        totalCorrect = 0;
        totalUnanswered = 0;
        totalQuestions = 1;
        specificCategoryId = 319;
        actions.updateAllStats(expectedSpecificCategoryStats, expectedGeneralCategoryStats,expectedSubjectStats,
            totalQuestions,totalCorrect,totalUnanswered,specificCategoryId);

        totalCorrect = 0;
        totalUnanswered = 0;
        totalQuestions = 2;
        specificCategoryId = 316;
        actions.updateAllStats(expectedSpecificCategoryStats, expectedGeneralCategoryStats,expectedSubjectStats,
            totalQuestions,totalCorrect,totalUnanswered,specificCategoryId);

        expect(testStorage.db.users.$$uid.stats.specificCategoryStats).toEqual(expectedSpecificCategoryStats);
        expect(testStorage.db.users.$$uid.stats.generalCategoryStats).toEqual(expectedGeneralCategoryStats);
        expect(testStorage.db.users.$$uid.stats.subjectStats).toEqual(expectedSubjectStats);
    });
});
