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
        testStorage.db.examResults = {};
        testStorage.db.users = {
            '$$uid':{
                exerciseResults: {},
                examResults: {}
            }
        };
    });

    xdescribe('testing get exercise result', function(){
        it('when requesting for a not exiting result then a new initialized result should be returned', function () {
            var exerciseId = 1;
            var exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.TUTORIAL.enum, exerciseId);
            var expectedExerciseResult = {
                exerciseId: exerciseId,
                exerciseTypeId: ExerciseTypeEnum.TUTORIAL.enum,
                startedTime: '%currTimeStamp%',
                questionResults: []
            };
            expect(exerciseResult).toEqual(jasmine.objectContaining(expectedExerciseResult));
        });

        it('when requesting for a not exiting result then a new initialized result should be saved in db', function () {
            var exerciseId = 1;
            actions.getExerciseResult(ExerciseTypeEnum.TUTORIAL.enum, exerciseId);
            var expectedResultGuid = Object.keys(testStorage.db.exerciseResults)[0];
            var exerciseResultGuid = testStorage.db.users.$$uid.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum][exerciseId];
            expect(exerciseResultGuid).toBe(expectedResultGuid);
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

            var guid = testStorage.db.users.$$uid.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum][exerciseId];
            var exerciseResult = testStorage.db.exerciseResults[guid];

            delete expectedResult.$save;

            expect(exerciseResult).toEqual(jasmine.objectContaining(expectedResult));
        });

        it('when requesting for result by guid and it not exist then it should be set to init result', function () {
            var exerciseId = 1;

            testStorage.db.users.$$uid.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum] = {};
            testStorage.db.users.$$uid.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum][exerciseId] = 123;

            var exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.TUTORIAL.enum, exerciseId);
            var expectedExerciseResult = {
                exerciseId: exerciseId,
                exerciseTypeId: ExerciseTypeEnum.TUTORIAL.enum,
                startedTime: '%currTimeStamp%',
                questionResults: []
            };
            expect(exerciseResult).toEqual(jasmine.objectContaining(expectedExerciseResult));
        });
    });

    describe('test get exam result', function(){
        it('when requesting for not existing exam result then initialized result should be returned', function(){
            var examId = 1;

            var examResult = actions.getExamResult(examId);
            var expectedExamResult = {
                isComplete: false,
                startedTime: '%currTimeStamp%',
                examId: examId
            };
            expect(examResult).toEqual(jasmine.objectContaining(expectedExamResult));
        });

        it('when requesting for not existing exam result then initialized result should be saved in db', function(){
            var examId = 1;
            actions.getExamResult(examId);
            var examResultKeys = Object.keys(testStorage.db.examResults);
            var examResultGuid = examResultKeys[0];
            expect(testStorage.db.users.$$uid.examResults[examId]).toBe(examResultGuid);
        });

        it('when requesting for existing result then it should be returned',function(){
            var examId = 1;
            testStorage.db.users.$$uid.examResults[examId] = 'guid';
            var expectedResult = {
                isComplete: false,
                startedTime: '%currTimeStamp%',
                examId: examId,
                sectionResults: {
                    1: 1
                }
            };

            testStorage.db.examResults['guid'] = expectedResult;
            var examResult = actions.getExamResult(examId);
            expect(examResult).toEqual(jasmine.objectContaining(expectedResult));
        });

        it('when changing not exiting result data and saving then it should be saved it db',function(){
            var examId = 1;
            var expectedResult = actions.getExamResult(examId);
            expectedResult.newProp = 'new value';
            expectedResult.$save();

            var examResultKeys = Object.keys(testStorage.db.examResults);
            var examResult = testStorage.db.examResults[examResultKeys[0]];

            delete expectedResult.$save;

            expect(examResult).toEqual(expectedResult);
        });

        it('when requesting for exam result by guid and it not exist then it should be set to init result', function () {
            var examId = 1;
            testStorage.db.users.$$uid.examResults[examId] = 'guid';

            var examResult = actions.getExamResult(examId);
            var expectedExamResult = {
                isComplete: false,
                startedTime: '%currTimeStamp%',
                examId: examId
            };
            expect(examResult).toEqual(jasmine.objectContaining(expectedExamResult));
        });
    });
});
