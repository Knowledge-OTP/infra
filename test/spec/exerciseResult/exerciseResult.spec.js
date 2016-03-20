describe('testing service "ExerciseResult":', function () {
    'use strict';

    beforeEach(module('znk.infra.exerciseResult', 'znk.infra.storage', 'znk.infra.enum',
        'htmlTemplates', 'testUtility', 'storage.mock', 'user.mock'));

    var $rootScope, ExerciseResultSrv, ExerciseTypeEnum, actions, testStorage, ExerciseStatusEnum;
    beforeEach(inject([
        '$injector',
        function ($injector) {
            $rootScope = $injector.get('$rootScope');
            ExerciseResultSrv = $injector.get('ExerciseResultSrv');
            ExerciseTypeEnum = $injector.get('ExerciseTypeEnum');
            testStorage = $injector.get('testStorage');
            ExerciseStatusEnum = $injector.get('ExerciseStatusEnum');

            var TestUtilitySrv = $injector.get('TestUtilitySrv');
            actions = TestUtilitySrv.general.convertAllAsyncToSync(ExerciseResultSrv);
        }]));

    beforeEach(function () {
        testStorage.db.exerciseResults = {};
        testStorage.db.examResults = {};
        testStorage.db.users = {
            '$$uid': {
                exerciseResults: {},
                examResults: {},
                exercisesStatus:{}
            }
        };
    });

    describe('testing exercise result', function () {
        it('when requesting for a not exiting result then a new initialized result should be returned', function () {
            var exerciseId = 20;
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
            var exerciseId = 10;
            actions.getExerciseResult(ExerciseTypeEnum.TUTORIAL.enum, exerciseId);
            var expectedResultGuid = Object.keys(testStorage.db.exerciseResults)[0];
            var exerciseResultGuid = testStorage.db.users.$$uid.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum][exerciseId];
            expect(exerciseResultGuid).toBe(expectedResultGuid);
        });

        it('when requesting for an exiting result then it should be returned', function () {
            var exerciseId = 10;
            var questionGuid = 123;

            var result = {
                exerciseId: exerciseId,
                exerciseTypeId: ExerciseTypeEnum.TUTORIAL.enum,
                startedTime: '%currTimeStamp%',
                guid: questionGuid
            };

            var expectedResult = angular.copy(result);
            expectedResult.questionResults = [];

            testStorage.db.exerciseResults[questionGuid] = result;
            testStorage.db.users.$$uid.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum] = {};
            testStorage.db.users.$$uid.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum][exerciseId] = questionGuid;

            var exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.TUTORIAL.enum, exerciseId);
            expect(exerciseResult).toEqual(jasmine.objectContaining(expectedResult));
        });

        it('when requesting for an exiting result which has user answers then it should be returned', function () {
            var exerciseId = 10;
            var questionGuid = 123;

            var result = {
                exerciseId: exerciseId,
                exerciseTypeId: ExerciseTypeEnum.TUTORIAL.enum,
                startedTime: '%currTimeStamp%',
                guid: questionGuid,
                questionResults: [{
                    userAnswer: 1
                }]
            };

            var expectedResult = angular.copy(result);

            testStorage.db.exerciseResults[questionGuid] = result;
            testStorage.db.users.$$uid.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum] = {};
            testStorage.db.users.$$uid.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum][exerciseId] = questionGuid;

            var exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.TUTORIAL.enum, exerciseId);
            expect(exerciseResult).toEqual(jasmine.objectContaining(expectedResult));
        });

        it('when saving result then it should be saved in db', function () {
            var exerciseId = 10;
            var expectedResult = actions.getExerciseResult(ExerciseTypeEnum.TUTORIAL.enum, exerciseId);
            expectedResult.questionResults.push({userAnswer: 2});
            expectedResult.$save();
            $rootScope.$digest();

            var guid = testStorage.db.users.$$uid.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum][exerciseId];
            var exerciseResult = testStorage.db.exerciseResults[guid];

            delete expectedResult.$save;
            angular.forEach(expectedResult, function(value, key){
                expect(exerciseResult[key]).toEqual(value);
            });
        });

        it('when requesting for result by guid and it not exist then it should be set to init result', function () {
            var exerciseId = 10;

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

    describe('test exam result', function () {
        it('when requesting for not existing exam result then initialized result should be returned', function () {
            var examId = 1;

            var examResult = actions.getExamResult(examId);
            var expectedExamResult = {
                isComplete: false,
                startedTime: '%currTimeStamp%',
                examId: examId
            };
            expect(examResult).toEqual(jasmine.objectContaining(expectedExamResult));
        });

        it('when requesting for not existing exam result then initialized result should be saved in db', function () {
            var examId = 1;
            actions.getExamResult(examId);
            var examResultKeys = Object.keys(testStorage.db.examResults);
            var examResultGuid = examResultKeys[0];
            expect(testStorage.db.users.$$uid.examResults[examId]).toBe(examResultGuid);
        });

        it('when requesting for existing result then it should be returned', function () {
            var examId = 1;
            var guid = 123;

            testStorage.db.users.$$uid.examResults[examId] = 'guid';
            var result = {
                isComplete: false,
                startedTime: '%currTimeStamp%',
                examId: examId,
                guid: guid
            };
            testStorage.db.users.$$uid.examResults[examId] = guid;
            testStorage.db.examResults[guid] = result;

            var expectedResult = angular.copy(result);
            expectedResult.sectionResults = {};

            var examResult = actions.getExamResult(examId);

            expect(examResult).toEqual(jasmine.objectContaining(expectedResult));
        });

        it('when requesting for existing result which has sectionResults then it should be returned', function () {
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

        it('when changing not exiting result data and saving then it should be saved it db', function () {
            var examId = 1;
            var expectedResult = actions.getExamResult(examId);
            expectedResult.newProp = 'new value';
            expectedResult.$save();

            var examResultKeys = Object.keys(testStorage.db.examResults);
            var examResult = testStorage.db.examResults[examResultKeys[0]];

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

    describe('test section result', function () {
        it('when retrieving not exiting section result then this section should be added to relevant exam result', function () {
            var sectionId = 10;
            var examId = 1;
            actions.getExerciseResult(ExerciseTypeEnum.SECTION.enum, sectionId, examId);
            var examResultGuid = testStorage.db.users.$$uid.examResults[1];
            var examResult = testStorage.db.examResults[examResultGuid];
            var sectionResultGuid = testStorage.db.users.$$uid.exerciseResults[ExerciseTypeEnum.SECTION.enum][sectionId];
            expect(examResult.sectionResults[sectionId]).toBe(sectionResultGuid);
        });
    });

    describe('test exercise status', function () {
        it('given exercise is not completed when saving exercise result then it status should be saved', function () {
            //isComplete
            var exerciseId = 10;
            var exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.DRILL.enum, exerciseId);
            exerciseResult.$save();
            $rootScope.$digest();

            var expectedExercisesStatusData = {};
            expectedExercisesStatusData[ExerciseTypeEnum.DRILL.enum] = {};
            expectedExercisesStatusData[ExerciseTypeEnum.DRILL.enum][exerciseId] = {
                status: ExerciseStatusEnum.ACTIVE.enum
            };

            var exercisesStatusData = testStorage.db.users.$$uid.exercisesStatus;

            expect(exercisesStatusData).toEqual(expectedExercisesStatusData);
        });

        it('given exercise is completed when saving exercise result then it status should be saved', function () {
            var exerciseId = 10;
            var exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.DRILL.enum, exerciseId);
            exerciseResult.isComplete = true;
            exerciseResult.$save();
            $rootScope.$digest();

            var expectedExercisesStatusData = {};
            expectedExercisesStatusData[ExerciseTypeEnum.DRILL.enum] = {};
            expectedExercisesStatusData[ExerciseTypeEnum.DRILL.enum][exerciseId] = {
                status: ExerciseStatusEnum.COMPLETED.enum
            };

            var exercisesStatusData = testStorage.db.users.$$uid.exercisesStatus;

            expect(exercisesStatusData).toEqual(expectedExercisesStatusData);
        });

        it('given exercise is completed when saving exercise result then it status should be saved', function () {
            //isComplete
            var exerciseId = 10;
            var exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.DRILL.enum, exerciseId);
            exerciseResult.isComplete = true;
            exerciseResult.$save();
            $rootScope.$digest();

            var expectedExercisesStatusData = {};
            expectedExercisesStatusData[ExerciseTypeEnum.DRILL.enum] = {};
            expectedExercisesStatusData[ExerciseTypeEnum.DRILL.enum][exerciseId] = {
                status: ExerciseStatusEnum.COMPLETED.enum
            };

            var exercisesStatusData = testStorage.db.users.$$uid.exercisesStatus;

            expect(exercisesStatusData).toEqual(expectedExercisesStatusData);
        });

        it('when requesting for not started exercise status then new status should be returned',function(){
            var expectedStatus = {
                status: ExerciseStatusEnum.NEW.enum
            };
            var exerciseStatus = actions.getExerciseStatus(ExerciseTypeEnum.TUTORIAL.enum, 10);
            expect(exerciseStatus).toEqual(jasmine.objectContaining(expectedStatus));
        });

        it('when requesting for an active exercise then an active status should be returned',function(){
            var exerciseId = 5;
            testStorage.db.users.$$uid.exercisesStatus[ExerciseTypeEnum.DRILL.enum] = {};
            testStorage.db.users.$$uid.exercisesStatus[ExerciseTypeEnum.DRILL.enum][exerciseId] = {
                status: ExerciseStatusEnum.ACTIVE.enum
            };

            var expectedStatus = {
                status: ExerciseStatusEnum.ACTIVE.enum
            };
            var exerciseStatus = actions.getExerciseStatus(ExerciseTypeEnum.DRILL.enum,exerciseId);
            expect(exerciseStatus).toEqual(jasmine.objectContaining(expectedStatus));
        });

        it('when requesting for a completed exercise then an completed status should be returned',function(){
            var exerciseId = 5;
            testStorage.db.users.$$uid.exercisesStatus[ExerciseTypeEnum.DRILL.enum] = {};
            testStorage.db.users.$$uid.exercisesStatus[ExerciseTypeEnum.DRILL.enum][exerciseId] = {
                status: ExerciseStatusEnum.COMPLETED.enum
            };

            var expectedStatus = {
                status: ExerciseStatusEnum.COMPLETED.enum
            };
            var exerciseStatus = actions.getExerciseStatus(ExerciseTypeEnum.DRILL.enum,exerciseId);
            expect(exerciseStatus).toEqual(jasmine.objectContaining(expectedStatus));
        });
    });

    describe('test analytics calculation',function(){
        it('when saving exercise result then average time per question should be calculated', function(){
            var exerciseId = 10;
            var exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.DRILL.enum, exerciseId);
            exerciseResult.questionResults = [{
                userAnswer: 1,
                timeSpent: 20000
            },{
                userAnswer: 3,
                timeSpent: 2000
            },{
                userAnswer: 3
            }];
            exerciseResult.$save();
            $rootScope.$digest();

            exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.DRILL.enum, exerciseId);
            var expectedResult = Math.round((20000 + 2000) / 3);
            expect(exerciseResult.avgTimePerQuestion).toBe(expectedResult);
        });

        it('when saving exercise result without answers then average time per question should be 0', function(){
            var exerciseId = 10;
            var exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.DRILL.enum, exerciseId);
            exerciseResult.$save();
            $rootScope.$digest();

            exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.DRILL.enum, exerciseId);
            var expectedResult = 0;
            expect(exerciseResult.avgTimePerQuestion).toBe(expectedResult);
        });

        it('when saving exercise results then analytics should be calculated accordingly', function(){
            var exerciseId = 10;
            var exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.DRILL.enum, exerciseId);
            exerciseResult.questionResults = [{
                isAnsweredCorrectly: true,    // correct
                timeSpent: 100,
                userAnswer: 1
            },{
                isAnsweredCorrectly: false,   // wrong
                timeSpent: 20,
                userAnswer: 2
            },{
                isAnsweredCorrectly: false,  // wrong
                timeSpent: 30,
                userAnswer: 1
            },{
                isAnsweredCorrectly: true,   // correct
                timeSpent: 205,
                userAnswer: 1
            },{
                isAnsweredCorrectly: true,   // correct
                timeSpent: 3,
                userAnswer: 2
            },{
                isAnsweredCorrectly: false,  // skipped
                timeSpent: 12163
            },{
                isAnsweredCorrectly: false,  // wrong
                timeSpent: 2,
                userAnswer: 1
            },{
                isAnsweredCorrectly: true,   // correct
                timeSpent: 4,
                userAnswer: 1
            },{
                isAnsweredCorrectly: false,  // skipped
                timeSpent: 12163
            },{
                isAnsweredCorrectly: true,   // correct
                timeSpent: 5,
                userAnswer: 1
            }];

            exerciseResult.$save();
            $rootScope.$digest();

            exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.DRILL.enum, exerciseId);
            var expectedResult = {};

            expectedResult.correctAvgTime = 63;
            expectedResult.wrongAvgTime = 17;
            expectedResult.skippedAvgTime = 12163;
            expectedResult.correctAnswersNum = 5;
            expectedResult.wrongAnswersNum =  3;
            expectedResult.skippedAnswersNum = 2;

            expect(exerciseResult).toEqual(jasmine.objectContaining(expectedResult));
        });
    });

    describe('test save exam isCompleted when all sections are completed',function(){

        it('when section is not complete, then examResult.isComplete = false', function(){
            var exerciseId = 4;
            var examSectionsNum = 5;
            var examId = 45;
            var exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.SECTION.enum, exerciseId, examId, examSectionsNum);
            exerciseResult.$save();
            $rootScope.$digest();
            var examResult = actions.getExamResult(examId);
            expect(examResult.isComplete).toEqual(false);
        });

        it('when section is complete, but other section not started, then examResult.isComplete = false', function(){
            var exerciseId = 4;
            var examSectionsNum = 5;
            var examId = 45;
            var exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.SECTION.enum, exerciseId, examId, examSectionsNum);
            exerciseResult.isComplete = true;
            exerciseResult.$save();
            $rootScope.$digest();
            var examResult = actions.getExamResult(examId);
            expect(examResult.isComplete).toEqual(false);
        });

        it('when section is complete, and other section are started but not completed, then examResult.isComplete = false', function(){
            var exerciseId = 4;
            var examSectionsNum = 5;
            var examId = 45;
            var sectionResultsObj = {
                1: '111',
                2: '111',
                3: '111',
                4: '111',
                5: '111'
            };
            var expectedExercisesStatusData =  testStorage.db.users.$$uid.exercisesStatus;
            expectedExercisesStatusData[ExerciseTypeEnum.SECTION.enum] = {};
            for(var key in sectionResultsObj) {
                expectedExercisesStatusData[ExerciseTypeEnum.SECTION.enum][key] = {
                    status: ExerciseStatusEnum.ACTIVE.enum
                };
            }
            var examResult = actions.getExamResult(examId);
            examResult.sectionResults = sectionResultsObj;
            examResult.$save();
            $rootScope.$digest();
            var exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.SECTION.enum, exerciseId, examId, examSectionsNum);
            exerciseResult.isComplete = true;
            exerciseResult.$save();
            $rootScope.$digest();
            examResult = actions.getExamResult(examId);
            examResult.sectionResults = sectionResultsObj;
            examResult.$save();
            examResult = actions.getExamResult(examId);
            expect(examResult.isComplete).toEqual(false);
        });

        it('when section is complete, and other section are also completed, then examResult.isComplete = true', function(){
            var exerciseId = 4;
            var examSectionsNum = 5;
            var examId = 45;
            var sectionResultsObj = {
                1: '111',
                2: '111',
                3: '111',
                4: '111',
                5: '111'
            };
            var expectedExercisesStatusData =  testStorage.db.users.$$uid.exercisesStatus;
            expectedExercisesStatusData[ExerciseTypeEnum.SECTION.enum] = {};
            for(var key in sectionResultsObj) {
                expectedExercisesStatusData[ExerciseTypeEnum.SECTION.enum][key] = {
                    status: ExerciseStatusEnum.COMPLETED.enum
                };
            }
            var examResult = actions.getExamResult(examId);
            examResult.sectionResults = sectionResultsObj;
            examResult.$save();
            $rootScope.$digest();
            var exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.SECTION.enum, exerciseId, examId, examSectionsNum);
            exerciseResult.isComplete = true;
            exerciseResult.$save();
            $rootScope.$digest();
            examResult = actions.getExamResult(examId);
            examResult.sectionResults = sectionResultsObj;
            examResult.$save();
            examResult = actions.getExamResult(examId);
            expect(examResult.isComplete).toEqual(true);
        });

    });


});
