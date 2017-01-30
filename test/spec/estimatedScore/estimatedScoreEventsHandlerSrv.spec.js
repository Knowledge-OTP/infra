describe('testing service "EstimatedScoreEventsHandlerSrv":', function () {
    'use strict';

    beforeEach(module('znk.infra.estimatedScore', 'htmlTemplates', 'testUtility', 'storage.mock', 'estimatedScore.mock', 'content.mock'));

    var rawPointsForExerciseTypeMap = {
        4: {
            correctWithin: 1,
            correctAfter: 0,
            wrongWithin: -0.25,
            wrongAfter: 0,
            unanswered: 0
        },
        5: {
            correctWithin: 0.2,
            correctAfter: 0,
            wrongWithin: 0,
            wrongAfter: 0,
            unanswered: 0
        }
    };
    var shouldEventBeProcessed;
    beforeEach(module(function ($logProvider, EstimatedScoreSrvProvider, EstimatedScoreEventsHandlerSrvProvider) {
        $logProvider.debugEnabled(true);

        EstimatedScoreEventsHandlerSrvProvider.setEventProcessControl(function () {
            return function () {
                return angular.isDefined(shouldEventBeProcessed) ? shouldEventBeProcessed.apply(this, arguments) : true;
            };
        });
    }));

    var exerciseEventsConst, actions, TestUtilitySrv, $rootScope, ExerciseTypeEnum, SubjectEnum, StudentStorage,
        ExerciseAnswerStatusEnum, EstimatedScoreSrv, EstimatedScoreEventsHandlerSrv;
    beforeEach(inject(
        function ($injector) {
            exerciseEventsConst = $injector.get('exerciseEventsConst');
            $rootScope = $injector.get('$rootScope');
            TestUtilitySrv = $injector.get('TestUtilitySrv');
            EstimatedScoreSrv = $injector.get('EstimatedScoreSrv');
            EstimatedScoreEventsHandlerSrv = $injector.get('EstimatedScoreEventsHandlerSrv');
            ExerciseTypeEnum = $injector.get('ExerciseTypeEnum');
            SubjectEnum = $injector.get('SubjectEnum');
            var InfraConfigSrv = $injector.get('InfraConfigSrv');
            StudentStorage = TestUtilitySrv.general.asyncToSync(InfraConfigSrv.getStudentStorage, InfraConfigSrv)();
            ExerciseAnswerStatusEnum = $injector.get('ExerciseAnswerStatusEnum');

            TestUtilitySrv.general.printDebugLogs();

            actions = TestUtilitySrv.general.convertAllAsyncToSync(EstimatedScoreSrv);

            // actions.calculateRawScore = TestUtilitySrv.general.convertAllAsyncToSync(EstimatedScoreEventsHandlerSrv);

            actions.getSectionsRawScoresFromDb = function (subjectId) {
                return StudentStorage.adapter.__db.users.$$uid.estimatedScore.sectionsRawScores[subjectId];
            };

            actions.getEstimatedScoresFromDb = function (subjectId) {
                return StudentStorage.adapter.__db.users.$$uid.estimatedScore.estimatedScores[subjectId];
            };

            actions.getExercisesRawScoreFromDb = function (subjectId) {
                return StudentStorage.adapter.__db.users.$$uid.estimatedScore.exercisesRawScores[subjectId];
            };
        }
    ));

    it('when section is completed in diagnostic test then score object should be calculated accordingly', function () {
        var exam = content.exam47;
        exam.typeId = 2; //diagnostic
        var sectionKey = 'section' + exam.sections[0].id;
        var section = content[sectionKey];

        var CORRECT_NUM = 5;
        var UNANSWERED_NUM = 0;

        var resultsMock = TestUtilitySrv.exercise.mockExerciseResult(section, CORRECT_NUM, UNANSWERED_NUM, true);

        // $rootScope.$broadcast(exerciseEventsConst.section.FINISH, section, resultsMock, exam);
        EstimatedScoreEventsHandlerSrv.calculateRawScore(exerciseEventsConst, section, resultsMock, exam);
        // $rootScope.$digest();

        var scoresArr = actions.getEstimatedScoresFromDb(section.subjectId);

        expect(scoresArr.length).toEqual(1);

        var expectedResult = {
            exerciseType: ExerciseTypeEnum.SECTION.enum,
            exerciseId: section.id,
            score: (0 * 90) + (1 * 100) + (2 * 120) + (1 * 140) + (1 * 150) + //correct
                (1 * 50) + (3 * 60) + (2 * 80) + (1 * 100) + (2 * 120) //wrong
            //score: (/*3*/ 3 * 120) + (/*2*/ 1 * 100) + (/*4*/ 1 * 140) +
            //(/*1*/ 3 * 50) + (/*5*/ 2 * 120) + (/*4*/ 3 * 100) + (/*2*/ 2 * 60) + (/*3*/ 2 * 80)
        };
        expect(scoresArr[0]).toEqual(jasmine.objectContaining(expectedResult));
        //testing that same event will not be processed twice
        // $rootScope.$broadcast(exerciseEventsConst.section.FINISH, section, resultsMock, exam);
        EstimatedScoreEventsHandlerSrv.calculateRawScore(exerciseEventsConst, section, resultMock, exam);
        // $rootScope.$digest();
        scoresArr = actions.getEstimatedScoresFromDb(section.subjectId);
        expect(scoresArr.length).toEqual(1);
    });

    xit('when writing section is completed in diagnostic test then raw score object should be calculated accordingly', function () {
        var exam = content.exam47;
        exam.typeId = 2; //diagnostic
        var sectionKey = 'section' + exam.sections[0].id;
        var section = content[sectionKey];

        var CORRECT_NUM = 5;
        var UNANSWERED_NUM = 0;
        var TOTAL_QUESTIONS = section.questions.length;

        var resultsMock = TestUtilitySrv.exercise.mockExerciseResult(section, CORRECT_NUM, UNANSWERED_NUM, true);

        // $rootScope.$broadcast(exerciseEventsConst.section.FINISH, section, resultsMock, exam);
        EstimatedScoreEventsHandlerSrv.calculateRawScore(exerciseEventsConst, section, resultMock, exam);
        // $rootScope.$digest();
        var sectionRawScore = actions.getSectionsRawScoresFromDb(section.subjectId);
        var sectionRawPointsMap = rawPointsForExerciseTypeMap[ExerciseTypeEnum.SECTION.enum];
        var expectedResult = {
            exerciseType: ExerciseTypeEnum.SECTION.enum,
            exerciseId: section.id,
            total: sectionRawPointsMap.correctWithin * TOTAL_QUESTIONS,
            earned: CORRECT_NUM * sectionRawPointsMap.correctWithin + (TOTAL_QUESTIONS - CORRECT_NUM - UNANSWERED_NUM) * sectionRawPointsMap.wrongWithin
        };
        expect(sectionRawScore.length).toBe(1);
        expect(sectionRawScore[0]).toEqual(jasmine.objectContaining(expectedResult));

        //testing that same event will not be processed twice
        // $rootScope.$broadcast(exerciseEventsConst.section.FINISH, section, resultsMock, exam);
        EstimatedScoreEventsHandlerSrv.calculateRawScore(exerciseEventsConst, section, resultMock, exam);
        // $rootScope.$digest();
        sectionRawScore = actions.getSectionsRawScoresFromDb(section.subjectId);
        expect(sectionRawScore.length).toBe(1);
        expect(sectionRawScore[0]).toEqual(jasmine.objectContaining(expectedResult));
    });

    it('when drill exercise is completed then raw score and estimated should be updated accordingly', function () {
        var drillMock = content.drill10;
        var diagnosticSectionRawScoreMock = {
            exerciseType: 4,
            exerciseId: 1087,
            total: 15,
            earned: 2,
            time: 1441608399119
        };
        var estimatedScoreMock = {
            exerciseType: 4,
            exerciseId: 1087,
            score: 24,
            time: 1441625776941
        };
        StudentStorage.adapter.__db.users.$$uid.estimatedScore = {
            sectionsRawScores: {},
            estimatedScores: {}
        };
        StudentStorage.adapter.__db.users.$$uid.estimatedScore.sectionsRawScores[drillMock.subjectId] = [diagnosticSectionRawScoreMock];
        StudentStorage.adapter.__db.users.$$uid.estimatedScore.estimatedScores[drillMock.subjectId] = [estimatedScoreMock];


        var TOTAL_QUESTIONS = drillMock.questions.length;
        var CORRECT_NUM = 5;
        var UNANSWERED_NUM = 2;
        var WRONG_NUM = CORRECT_NUM - UNANSWERED_NUM;
        var resultMock = TestUtilitySrv.exercise.mockExerciseResult(drillMock, CORRECT_NUM, UNANSWERED_NUM, true);

        // $rootScope.$broadcast(exerciseEventsConst.drill.FINISH, drillMock, resultMock);
        EstimatedScoreEventsHandlerSrv.calculateRawScore(exerciseEventsConst, drillMock, resultMock);
        // $rootScope.$digest();

        var drillRawPointsMap = rawPointsForExerciseTypeMap[ExerciseTypeEnum.DRILL.enum];
        var expectedRawScore = {
            exerciseType: ExerciseTypeEnum.DRILL.enum,
            exerciseId: drillMock.id,
            total: drillRawPointsMap.correctWithin * TOTAL_QUESTIONS,
            earned: CORRECT_NUM * drillRawPointsMap.correctWithin +
                WRONG_NUM * drillRawPointsMap.wrongWithin +
                UNANSWERED_NUM * drillRawPointsMap.unanswered
        };
        var exerciseRawScore = actions.getExercisesRawScoreFromDb(drillMock.subjectId);
        expect(exerciseRawScore).toEqual(jasmine.objectContaining(expectedRawScore));

        var estimatedScore = actions.getEstimatedScoresFromDb(drillMock.subjectId);
        var expectedEstimatedScore = {
            exerciseType: ExerciseTypeEnum.DRILL.enum,
            exerciseId: drillMock.id,
            score: 25.40625
        };
        expect(estimatedScore.length).toBe(2);
        expect(estimatedScore[1]).toEqual(jasmine.objectContaining(expectedEstimatedScore));

        //testing that same event will not be processed twice
        // $rootScope.$broadcast(exerciseEventsConst.drill.FINISH, drillMock, resultMock);
        EstimatedScoreEventsHandlerSrv.calculateRawScore(exerciseEventsConst, drillMock, resultMock);
        // $rootScope.$digest();
        estimatedScore = actions.getEstimatedScoresFromDb(drillMock.subjectId);
        expect(estimatedScore.length).toBe(2);
    });

    it('when section is completed then when calculating raw score then more weight should be given to latest finished sections', function () {
        var examMock = content.exam40;
        var sectionKey = 'section' + examMock.sections[0].id;
        var sectionMock = content[sectionKey];

        StudentStorage.adapter.__db.users.$$uid.estimatedScore = {
            sectionsRawScores: {},
            estimatedScores: {},
            exercisesRawScores: {}
        };

        var diagnosticSectionRawScoreMock = {
            exerciseType: 4,
            exerciseId: 1087,
            total: 15,
            earned: 2,
            time: 1441608399119
        };
        StudentStorage.adapter.__db.users.$$uid.estimatedScore.sectionsRawScores[sectionMock.subjectId] = [diagnosticSectionRawScoreMock];

        var estimatedScoresMock = [{
            exerciseType: 4,
            exerciseId: 1087,
            score: 34,
            time: 1441625776941
        }, {
            exerciseType: 3,
            exerciseId: 1087,
            score: 38.845,
            time: 1441625776941
        }];
        StudentStorage.adapter.__db.users.$$uid.estimatedScore.estimatedScores[sectionMock.subjectId] = estimatedScoresMock;

        var exerciseRawScoreMock = {
            earned: 15,
            total: 20
        };
        StudentStorage.adapter.__db.users.$$uid.estimatedScore.exercisesRawScores[sectionMock.subjectId] = exerciseRawScoreMock;

        var CORRECT_NUM = 60;
        var UNANSWERED_NUM = 1;
        var resultMock = TestUtilitySrv.exercise.mockExerciseResult(sectionMock, CORRECT_NUM, UNANSWERED_NUM, true);

        // $rootScope.$broadcast(exerciseEventsConst.section.FINISH, sectionMock, resultMock, examMock);
        EstimatedScoreEventsHandlerSrv.calculateRawScore(exerciseEventsConst, sectionMock, resultMock, examMock);
        // $rootScope.$digest();

        var estimatedScores = actions.getEstimatedScoresFromDb(sectionMock.subjectId);
        var expectedEstimatedScore = {
            exerciseType: ExerciseTypeEnum.SECTION.enum,
            exerciseId: sectionMock.id,
            score: 179.08
        };
        expect(estimatedScores.length).toBe(3);
        expect(estimatedScores[2]).toEqual(jasmine.objectContaining(expectedEstimatedScore));


        //testing that same event will not be processed twice
        // $rootScope.$broadcast(exerciseEventsConst.section.FINISH, sectionMock, resultMock, examMock);
        EstimatedScoreEventsHandlerSrv.calculateRawScore(exerciseEventsConst, sectionMock, resultMock, examMock);
        // $rootScope.$digest();
        var estimatedScores = actions.getEstimatedScoresFromDb(sectionMock.subjectId);
        expect(estimatedScores.length).toBe(3);
        expect(estimatedScores[2]).toEqual(jasmine.objectContaining(expectedEstimatedScore));
    });

    it('when exercise is completed and no initial score is set then the received score should be set as the initial one', function () {
        var drillMock = content.drill10;
        var estimatedScoreMock = {
            exerciseType: 4,
            exerciseId: 1087,
            score: 24,
            time: 1441625776941
        };

        var CORRECT_NUM = 5;
        var UNANSWERED_NUM = 2;
        var resultMock = TestUtilitySrv.exercise.mockExerciseResult(drillMock, CORRECT_NUM, UNANSWERED_NUM, true);

        // $rootScope.$broadcast(exerciseEventsConst.drill.FINISH, drillMock, resultMock);
        EstimatedScoreEventsHandlerSrv.calculateRawScore(exerciseEventsConst, drillMock, resultMock);
        // $rootScope.$digest();

        var estimatedScore = actions.getEstimatedScoresFromDb(drillMock.subjectId);
        var expectedEstimatedScore = {
            exerciseType: ExerciseTypeEnum.DRILL.enum,
            exerciseId: drillMock.id,
            score: 90
        };
        expect(estimatedScore.length).toBe(1);
        expect(estimatedScore[0]).toEqual(jasmine.objectContaining(expectedEstimatedScore));
    });

    it('when shouldBeProcessed return false than the event should not be processed', function () {
        spyOn(EstimatedScoreSrv, 'addRawScore');
        shouldEventBeProcessed = function (exerciseType, exercise, result) {
            return exercise.id === 10;
        };

        var drillMock = content.drill10;
        var CORRECT_NUM = 5;
        var UNANSWERED_NUM = 2;
        var resultMock = TestUtilitySrv.exercise.mockExerciseResult(drillMock, CORRECT_NUM, UNANSWERED_NUM, true);

        // $rootScope.$broadcast(exerciseEventsConst.drill.FINISH, drillMock, resultMock);
        EstimatedScoreEventsHandlerSrv.calculateRawScore(exerciseEventsConst, drillMock, resultMock);
        // $rootScope.$digest();

        drillMock.id = 12;
        // $rootScope.$broadcast(exerciseEventsConst.drill.FINISH, drillMock, resultMock);
        EstimatedScoreEventsHandlerSrv.calculateRawScore(exerciseEventsConst, drillMock, resultMock);
        // $rootScope.$digest();

        expect(EstimatedScoreSrv.addRawScore).toHaveBeenCalledTimes(1);
    });
});
