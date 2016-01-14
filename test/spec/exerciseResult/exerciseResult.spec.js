describe('testing service "ExerciseResult":', function () {
    'use strict';

    beforeEach(module('znk.infra.exerciseResult', 'znk.infra.storage', 'znk.infra.enum',
        'htmlTemplates', 'testUtility', 'storage.mock'));

    var $rootScope, ExerciseResultSrv, ExerciseTypeEnum, actions, testStorage;
    beforeEach(inject([
        '$injector',
        function ($injector) {
            $rootScope = $injector.get('$rootScope');
            ExerciseResultSrv = $injector.get('ExerciseResultSrv');
            ExerciseTypeEnum = $injector.get('ExerciseTypeEnum');
            testStorage = $injector.get('testStorage');

            var TestUtilitySrv = $injector.get('TestUtilitySrv');
            actions = TestUtilitySrv.general.convertAllAsyncToSync(ExerciseResultSrv);
        }]));

    beforeEach(function(){
        testStorage.db.exerciseResults = {};
        testStorage.db.users = {
            '$$uid':{
                exerciseResults: {}
            }
        };
    });

    it('when requesting for a not exiting result then a new initialized result should be returned', function () {
        var exerciseId = 1;
        var exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.TUTORIAL.enum, exerciseId);
        var expectedExerciseResult = {
            exerciseId: exerciseId,
            exerciseTypeId: ExerciseTypeEnum.TUTORIAL.enum,
            startedTime: '%currTimeStamp%',
            questionResults: []
        };
        expect(exerciseResult).toEqual(expectedExerciseResult);
    });

    it('when requesting for an exiting result then it should be returned', function () {
        var exerciseId = 1;
        var expectedExerciseResult = {
            exerciseId: exerciseId,
            exerciseTypeId: ExerciseTypeEnum.TUTORIAL.enum,
            startedTime: '%currTimeStamp%',
            questionResults: [{userAnswer: 1}]
        };

        testStorage.db.exerciseResults[123] = expectedExerciseResult;
        testStorage.db.users.$$uid.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum] = {};
        testStorage.db.users.$$uid.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum][exerciseId] = 123;

        var exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.TUTORIAL.enum, exerciseId);
        expect(exerciseResult).toEqual(expectedExerciseResult);
    });

    it('when saving result then it should be saved in db', function () {
        var exerciseId = 1;
        var expectedResult = actions.getExerciseResult(ExerciseTypeEnum.TUTORIAL.enum, exerciseId);
        expectedResult.questionResults.push({userAnswer: 2});
        expectedResult.$save();

        var exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.TUTORIAL.enum, exerciseId);
        expect(exerciseResult).toEqual(expectedExerciseResult);
    });
});
