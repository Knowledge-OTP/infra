describe('testing service "ExerciseResult":', function () {
    'use strict';

    beforeEach(module('znk.infra.exerciseResult', 'znk.infra.storage', 'znk.infra.enum',
        'htmlTemplates', 'testUtility', 'storage.mock', 'user.mock'));

    var $rootScope, ExerciseResultSrv, ExerciseTypeEnum, actions, StudentStorage, ExerciseStatusEnum;
    beforeEach(inject([
        '$injector',
        function ($injector) {
            $rootScope = $injector.get('$rootScope');

            ExerciseResultSrv = $injector.get('ExerciseResultSrv');

            ExerciseTypeEnum = $injector.get('ExerciseTypeEnum');

            var TestUtilitySrv = $injector.get('TestUtilitySrv');

            var InfraConfigSrv = $injector.get('InfraConfigSrv');
            StudentStorage = TestUtilitySrv.general.asyncToSync(InfraConfigSrv.getStudentStorage, InfraConfigSrv)();

            ExerciseStatusEnum = $injector.get('ExerciseStatusEnum');

            actions = TestUtilitySrv.general.convertAllAsyncToSync(ExerciseResultSrv);
        }]));

    beforeEach(function () {
        StudentStorage.adapter.__db.exerciseResults = {};
        StudentStorage.adapter.__db.examResults = {};
        StudentStorage.adapter.__db.users = {
            '$$uid': {
                exerciseResults: {},
                examResults: {},
                exercisesStatus:{}
            }
        };
    });

    function _isValidStartedTime(startedTimeValue){
        return angular.isNumber(startedTimeValue) && !isNaN(startedTimeValue);
    }

    describe('testing exercise result', function () {
        it('when requesting for a not exiting result then a new initialized result should be returned', function () {
            var exerciseId = 20;
            var exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.TUTORIAL.enum, exerciseId);
            var expectedExerciseResult = {
                exerciseId: exerciseId,
                exerciseTypeId: ExerciseTypeEnum.TUTORIAL.enum,
                questionResults: []
            };
            expect(exerciseResult).toEqual(jasmine.objectContaining(expectedExerciseResult));
            expect(_isValidStartedTime(exerciseResult.startedTime)).toBeTruthy();
        });

        it('when requesting for a not exiting result with dont initialize pararmter then a new result should not be created ' +
            'and null should be returned', function () {
            var exerciseId = 20;
            var dontInitIfNotExists = true;
            var exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.TUTORIAL.enum, exerciseId, undefined, undefined, dontInitIfNotExists);
            expect(exerciseResult).toBeNull();
            expect(StudentStorage.adapter.__db.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum]).toBeUndefined();
        });

        it('when requesting for a not exiting result then a new initialized result should be saved in db', function () {
            var exerciseId = 10;
            actions.getExerciseResult(ExerciseTypeEnum.TUTORIAL.enum, exerciseId);
            var expectedResultGuid = Object.keys(StudentStorage.adapter.__db.exerciseResults)[0];
            var exerciseResultGuid = StudentStorage.adapter.__db.users.$$uid.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum][exerciseId];
            expect(exerciseResultGuid).toBe(expectedResultGuid);
        });

        it('when requesting for an exiting result then it should be returned', function () {
            var exerciseId = 10;
            var questionGuid = 123;

            var result = {
                exerciseId: exerciseId,
                exerciseTypeId: ExerciseTypeEnum.TUTORIAL.enum,
                guid: questionGuid
            };

            var expectedResult = angular.copy(result);
            expectedResult.questionResults = [];

            StudentStorage.adapter.__db.exerciseResults[questionGuid] = result;
            StudentStorage.adapter.__db.users.$$uid.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum] = {};
            StudentStorage.adapter.__db.users.$$uid.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum][exerciseId] = questionGuid;

            var exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.TUTORIAL.enum, exerciseId);
            expect(exerciseResult).toEqual(jasmine.objectContaining(expectedResult));
            expect(_isValidStartedTime(exerciseResult.startedTime)).toBeTruthy();
        });

        it('when requesting for an exiting result which has user answers then it should be returned', function () {
            var exerciseId = 10;
            var questionGuid = 123;

            var result = {
                exerciseId: exerciseId,
                exerciseTypeId: ExerciseTypeEnum.TUTORIAL.enum,
                guid: questionGuid,
                questionResults: [{
                    userAnswer: 1
                }]
            };

            var expectedResult = angular.copy(result);

            StudentStorage.adapter.__db.exerciseResults[questionGuid] = result;
            StudentStorage.adapter.__db.users.$$uid.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum] = {};
            StudentStorage.adapter.__db.users.$$uid.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum][exerciseId] = questionGuid;

            var exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.TUTORIAL.enum, exerciseId);
            expect(exerciseResult).toEqual(jasmine.objectContaining(expectedResult));
            expect(_isValidStartedTime(exerciseResult.startedTime)).toBeTruthy();
        });

        it('when saving result then it should be saved in db', function () {
            var exerciseId = 10;
            var expectedResult = actions.getExerciseResult(ExerciseTypeEnum.TUTORIAL.enum, exerciseId);
            expectedResult.questionResults.push({userAnswer: 2});
            expectedResult.$save();
            $rootScope.$digest();

            var guid = StudentStorage.adapter.__db.users.$$uid.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum][exerciseId];
            var exerciseResult = StudentStorage.adapter.__db.exerciseResults[guid];

            delete expectedResult.$save;
            angular.forEach(expectedResult, function(value, key){
                expect(exerciseResult[key]).toEqual(value);
            });
        });

        it('when requesting for result and it not exist although the guid exists then it should be set to init result', function () {
            var exerciseId = 10;

            StudentStorage.adapter.__db.users.$$uid.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum] = {};
            StudentStorage.adapter.__db.users.$$uid.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum][exerciseId] = 123;

            var exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.TUTORIAL.enum, exerciseId);
            var expectedExerciseResult = {
                exerciseId: exerciseId,
                exerciseTypeId: ExerciseTypeEnum.TUTORIAL.enum,
                questionResults: []
            };
            expect(exerciseResult).toEqual(jasmine.objectContaining(expectedExerciseResult));
            expect(_isValidStartedTime(exerciseResult.startedTime)).toBeTruthy();
        });
    });

    describe('test exam result', function () {
        it('when requesting for not existing exam result then initialized result should be returned', function () {
            var examId = 1;

            var examResult = actions.getExamResult(examId);
            var expectedExamResult = {
                isComplete: false,
                examId: examId
            };
            expect(examResult).toEqual(jasmine.objectContaining(expectedExamResult));
            expect(_isValidStartedTime(examResult.startedTime)).toBeTruthy();
        });

        it('when requesting for not existing exam result then initialized result should be saved in db', function () {
            var examId = 1;
            actions.getExamResult(examId);
            var examResultKeys = Object.keys(StudentStorage.adapter.__db.examResults);
            var examResultGuid = examResultKeys[0];
            expect(StudentStorage.adapter.__db.users.$$uid.examResults[examId]).toBe(examResultGuid);
        });

        it('when requesting for existing result then it should be returned', function () {
            var examId = 1;
            var guid = 123;

            StudentStorage.adapter.__db.users.$$uid.examResults[examId] = 'guid';
            var result = {
                isComplete: false,
                examId: examId,
                guid: guid
            };
            StudentStorage.adapter.__db.users.$$uid.examResults[examId] = guid;
            StudentStorage.adapter.__db.examResults[guid] = result;

            var expectedResult = angular.copy(result);
            expectedResult.sectionResults = {};

            var examResult = actions.getExamResult(examId);

            expect(examResult).toEqual(jasmine.objectContaining(expectedResult));
            expect(_isValidStartedTime(examResult.startedTime)).toBeTruthy();
        });

        it('when requesting for existing result which has sectionResults then it should be returned', function () {
            var examId = 1;
            StudentStorage.adapter.__db.users.$$uid.examResults[examId] = 'guid';
            var expectedResult = {
                guid: 'guid',
                isComplete: false,
                examId: examId,
                sectionResults: {
                    1: 1
                }
            };

            StudentStorage.adapter.__db.examResults['guid'] = expectedResult;
            var examResult = actions.getExamResult(examId);
            expect(examResult).toEqual(jasmine.objectContaining(expectedResult));
            expect(_isValidStartedTime(examResult.startedTime)).toBeTruthy();
        });

        it('when changing not exiting result data and saving then it should be saved it db', function () {
            var examId = 1;
            var expectedResult = actions.getExamResult(examId);
            expectedResult.newProp = 'new value';
            expectedResult.$save();
            $rootScope.$digest();

            var examResultKeys = Object.keys(StudentStorage.adapter.__db.examResults);
            var examResult = StudentStorage.adapter.__db.examResults[examResultKeys[0]];

            expect(examResult).toEqual(expectedResult);
        });

        it('when requesting for exam result by guid and it not exist then it should be set to init result', function () {
            var examId = 1;
            StudentStorage.adapter.__db.users.$$uid.examResults[examId] = 'guid';

            var examResult = actions.getExamResult(examId);
            var expectedExamResult = {
                isComplete: false,
                examId: examId
            };
            expect(examResult).toEqual(jasmine.objectContaining(expectedExamResult));
            expect(_isValidStartedTime(examResult.startedTime)).toBeTruthy();
        });

        it('when requesting for exam result with dont initialize parameter then null should be returned', function(){
            var examId = 1;
            var dontInit = true;
            var examResult = actions.getExamResult(examId, dontInit);
            expect(examResult).toBeNull();
        });
    });

    describe('test section result', function () {
        it('when retrieving not exiting section result then this section should be added to relevant exam result', function () {
            var sectionId = 10;
            var examId = 1;
            actions.getExerciseResult(ExerciseTypeEnum.SECTION.enum, sectionId, examId);
            var examResultGuid = StudentStorage.adapter.__db.users.$$uid.examResults[1];
            var examResult = StudentStorage.adapter.__db.examResults[examResultGuid];
            var sectionResultGuid = StudentStorage.adapter.__db.users.$$uid.exerciseResults[ExerciseTypeEnum.SECTION.enum][sectionId];
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
                status: ExerciseStatusEnum.ACTIVE.enum,
                duration: 0
            };

            var exercisesStatusData = StudentStorage.adapter.__db.users.$$uid.exercisesStatus;
            //remove nested object constructor prototype
            var exerciseStatusDataWithoutConstructorPrototype = JSON.parse(JSON.stringify(exercisesStatusData));
            expect(exerciseStatusDataWithoutConstructorPrototype).toEqual(jasmine.objectContaining(expectedExercisesStatusData));
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
                status: ExerciseStatusEnum.COMPLETED.enum,
                duration: 0
            };

            var exercisesStatusData = StudentStorage.adapter.__db.users.$$uid.exercisesStatus;
            //remove nested object constructor prototype
            var exerciseStatusDataWithoutConstructorPrototype = JSON.parse(JSON.stringify(exercisesStatusData));
            expect(exerciseStatusDataWithoutConstructorPrototype).toEqual(expectedExercisesStatusData);
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
                status: ExerciseStatusEnum.COMPLETED.enum,
                duration: 0
            };

            var exercisesStatusData = StudentStorage.adapter.__db.users.$$uid.exercisesStatus;
            //remove nested object constructor prototype
            var exerciseStatusDataWithoutConstructorPrototype = JSON.parse(JSON.stringify(exercisesStatusData));
            expect(exerciseStatusDataWithoutConstructorPrototype).toEqual(expectedExercisesStatusData);
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
            StudentStorage.adapter.__db.users.$$uid.exercisesStatus[ExerciseTypeEnum.DRILL.enum] = {};
            StudentStorage.adapter.__db.users.$$uid.exercisesStatus[ExerciseTypeEnum.DRILL.enum][exerciseId] = {
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
            StudentStorage.adapter.__db.users.$$uid.exercisesStatus[ExerciseTypeEnum.DRILL.enum] = {};
            StudentStorage.adapter.__db.users.$$uid.exercisesStatus[ExerciseTypeEnum.DRILL.enum][exerciseId] = {
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
            expectedResult.totalQuestionNum = 10;
            expectedResult.totalAnsweredNum = 8;

            expect(exerciseResult).toEqual(jasmine.objectContaining(expectedResult));
        });
    });

    describe('test saving section result',function(){

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
            var expectedExercisesStatusData =  StudentStorage.adapter.__db.users.$$uid.exercisesStatus;
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
            var expectedExercisesStatusData =  StudentStorage.adapter.__db.users.$$uid.exercisesStatus;
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

        it('when section is saved then exam duration should be updated accordingly', function(){
            var examId = 1;
            var examSectionsId = [1,2,3];

            examSectionsId.forEach(function(sectionId){
                actions.getExerciseResult(ExerciseTypeEnum.SECTION.enum, sectionId, examId, examSectionsId.length);
            });

            var sectionsStatus = StudentStorage.adapter.__db.users.$$uid.exercisesStatus[ExerciseTypeEnum.SECTION.enum] = {};
            sectionsStatus[1] = {
                duration: 5000
            };
            sectionsStatus[2]={
                duration: 7500
            };

            var sectionId3Result = actions.getExerciseResult(ExerciseTypeEnum.SECTION.enum, 3, examId, examSectionsId.length);
            sectionId3Result.$save();

            var examResult = actions.getExamResult(examId);
            expect(examResult.duration).toBe(12500);
        });
    });

});
