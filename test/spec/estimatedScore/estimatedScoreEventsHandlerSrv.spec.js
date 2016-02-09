describe('testing service "EstimatedScoreEventsHandlerSrv":', function () {
    'use strict';

    beforeEach(module('znk.infra.estimatedScore', 'htmlTemplates', 'testUtility', 'storage.mock'));

    var rawPointsForExerciseTypeMap = {
        4:{
            correctWithin: 1,
            correctAfter: 0,
            wrongWithin: -0.25,
            wrongAfter: 0,
            unanswered: 0
        },
        5:{
            correctWithin: 0.2,
            correctAfter: 0,
            wrongWithin: 0,
            wrongAfter: 0,
            unanswered: 0
        }
    };

    beforeEach(module(function($logProvider, EstimatedScoreSrvProvider, EstimatedScoreEventsHandlerSrvProvider, exerciseTypeConst){
        $logProvider.debugEnabled(true);

        var subjectsRawScoreEdges = {
            0:{
                min: 0,
                max: 60
            },
            5: {
                min: 0,
                max: 85
            }
        };
        EstimatedScoreSrvProvider.setSubjectsRawScoreEdges(subjectsRawScoreEdges);

        EstimatedScoreSrvProvider.setRawScoreToRealScoreFn(function(){
            return function(subjectId, rawScore){
                return rawScore * 3;
            };
        });

        var MIN_DIAGNOSTIC_SCORE = 0;
        var MAX_DIAGNOSTIC_SCORE = 1500;
        EstimatedScoreSrvProvider.setMinMaxDiagnosticScore(MIN_DIAGNOSTIC_SCORE, MAX_DIAGNOSTIC_SCORE);

        var diagnosticRawScoringMap = {
            1: [90,90,50,50],
            2: [100,100,60,60],
            3: [120,120,80,80],
            4: [140,140,100,100],
            5: [150,150,120,120]
        };
        EstimatedScoreEventsHandlerSrvProvider.setDiagnosticScoring(diagnosticRawScoringMap);

        var sectionRawPoints = [1,0,-0.25,0];
        EstimatedScoreEventsHandlerSrvProvider.setExerciseRawPoints(exerciseTypeConst.SECTION, sectionRawPoints);

        var drillRawPoints = [0.2, 0, 0, 0];
        EstimatedScoreEventsHandlerSrvProvider.setExerciseRawPoints(exerciseTypeConst.DRILL, drillRawPoints);

        var allowedTimeForExercises = {
            5: 4 * 60 * 1000
        };
        EstimatedScoreEventsHandlerSrvProvider.setAllowedTimeForExercises(allowedTimeForExercises);
    }));

    var exerciseEventsConst, actions, TestUtilitySrv, $rootScope, ExerciseTypeEnum, SubjectEnum, testStorage,
        ExerciseAnswerStatusEnum;
    beforeEach(inject(
        function ($injector) {
            exerciseEventsConst = $injector.get('exerciseEventsConst');
            $rootScope = $injector.get('$rootScope');
            TestUtilitySrv = $injector.get('TestUtilitySrv');
            var EstimatedScoreSrv = $injector.get('EstimatedScoreSrv');
            ExerciseTypeEnum = $injector.get('ExerciseTypeEnum');
            SubjectEnum = $injector.get('SubjectEnum');
            testStorage = $injector.get('testStorage');
            ExerciseAnswerStatusEnum = $injector.get('ExerciseAnswerStatusEnum');

            TestUtilitySrv.general.printDebugLogs();

            actions = TestUtilitySrv.general.convertAllAsyncToSync(EstimatedScoreSrv);

            actions.getSectionsRawScoresFromDb = function(subjectId){
                return testStorage.db.users.$$uid.estimatedScore.sectionsRawScores[subjectId];
            };

            actions.getEstimatedScoresFromDb = function(subjectId){
                return testStorage.db.users.$$uid.estimatedScore.estimatedScores[subjectId];
            };

            actions.getExercisesRawScoreFromDb = function(subjectId){
                return testStorage.db.users.$$uid.estimatedScore.exercisesRawScores[subjectId];
            };
        }
    ));

    it('when section is completed in diagnostic test then score object should be calculated accordingly', function () {
        var exam = content.exam47;
        exam.typeId = 2;//diagnostic
        var sectionKey = 'section' + exam.sections[0].id;
        var section = content[sectionKey];

        var CORRECT_NUM = 5;
        var UNANSWERED_NUM = 0;

        var resultsMock = TestUtilitySrv.exercise.mockExerciseResult(section, CORRECT_NUM, UNANSWERED_NUM, true);

        $rootScope.$broadcast(exerciseEventsConst.section.FINISH, section, resultsMock, exam);
        $rootScope.$digest();

        var scoresArr = actions.getEstimatedScoresFromDb(section.subjectId);

        expect(scoresArr.length).toEqual(1);

        var expectedResult = {
            exerciseType: ExerciseTypeEnum.SECTION.enum,
            exerciseId: section.id,
            score: (0 * 90) + (1 * 100) + (2 * 120) + (1 * 140) + (1 * 150) +   //correct
                   (1 * 50) + (3 * 60) + (2 * 80) + (1 * 100) + (2 * 120)       //wrong
            //score: (/*3*/ 3 * 120) + (/*2*/ 1 * 100) + (/*4*/ 1 * 140) +
            //(/*1*/ 3 * 50) + (/*5*/ 2 * 120) + (/*4*/ 3 * 100) + (/*2*/ 2 * 60) + (/*3*/ 2 * 80)
        };
        expect(scoresArr[0]).toEqual(jasmine.objectContaining(expectedResult));
        //testing that same event will not be processed twice
        $rootScope.$broadcast(exerciseEventsConst.section.FINISH, section, resultsMock, exam);
        $rootScope.$digest();
        scoresArr = actions.getEstimatedScoresFromDb(section.subjectId);
        expect(scoresArr.length).toEqual(1);
    });

    it('when writing section is completed in diagnostic test then raw score object should be calculated accordingly', function () {
        var exam = content.exam47;
        exam.typeId = 2;//diagnostic
        var sectionKey = 'section' + exam.sections[0].id;
        var section = content[sectionKey];

        var CORRECT_NUM = 5;
        var UNANSWERED_NUM = 0;
        var TOTAL_QUESTIONS = section.questions.length;

        var resultsMock = TestUtilitySrv.exercise.mockExerciseResult(section, CORRECT_NUM, UNANSWERED_NUM, true);

        $rootScope.$broadcast(exerciseEventsConst.section.FINISH, section, resultsMock, exam);
        $rootScope.$digest();
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
        $rootScope.$broadcast(exerciseEventsConst.section.FINISH, section, resultsMock, exam);
        $rootScope.$digest();
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
        testStorage.db.users.$$uid.estimatedScore = {
            sectionsRawScores: {},
            estimatedScores: {}
        };
        testStorage.db.users.$$uid.estimatedScore.sectionsRawScores[drillMock.subjectId] = [diagnosticSectionRawScoreMock];
        testStorage.db.users.$$uid.estimatedScore.estimatedScores[drillMock.subjectId] = [estimatedScoreMock];


        var TOTAL_QUESTIONS = drillMock.questions.length;
        var CORRECT_NUM = 5;
        var UNANSWERED_NUM = 2;
        var WRONG_NUM = CORRECT_NUM - UNANSWERED_NUM;
        var resultMock = TestUtilitySrv.exercise.mockExerciseResult(drillMock, CORRECT_NUM, UNANSWERED_NUM, true);

        $rootScope.$broadcast(exerciseEventsConst.drill.FINISH, drillMock, resultMock);
        $rootScope.$digest();

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
        $rootScope.$broadcast(exerciseEventsConst.drill.FINISH, drillMock, resultMock);
        $rootScope.$digest();
        estimatedScore = actions.getEstimatedScoresFromDb(drillMock.subjectId);
        expect(estimatedScore.length).toBe(2);
    });

    it('when section is completed then when calculating raw score then more weight should be given to latest finished sections',function(){
        var examMock = content.exam40;
        var sectionKey = 'section' + examMock.sections[0].id;
        var sectionMock = content[sectionKey];

        testStorage.db.users.$$uid.estimatedScore = {
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
        testStorage.db.users.$$uid.estimatedScore.sectionsRawScores[sectionMock.subjectId] = [diagnosticSectionRawScoreMock];

        var estimatedScoresMock = [{
            exerciseType: 4,
            exerciseId: 1087,
            score: 34,
            time: 1441625776941
        },{
            exerciseType: 3,
            exerciseId: 1087,
            score: 38.845,
            time: 1441625776941
        }];
        testStorage.db.users.$$uid.estimatedScore.estimatedScores[sectionMock.subjectId] = estimatedScoresMock;

        var exerciseRawScoreMock = {
            earned: 15,
            total: 20
        };
        testStorage.db.users.$$uid.estimatedScore.exercisesRawScores[sectionMock.subjectId] = exerciseRawScoreMock;

        var CORRECT_NUM = 60;
        var UNANSWERED_NUM = 1;
        var resultMock = TestUtilitySrv.exercise.mockExerciseResult(sectionMock, CORRECT_NUM, UNANSWERED_NUM, true);

        $rootScope.$broadcast(exerciseEventsConst.section.FINISH, sectionMock, resultMock, examMock);
        $rootScope.$digest();

        var estimatedScores = actions.getEstimatedScoresFromDb(sectionMock.subjectId);
        var expectedEstimatedScore = {
            exerciseType: ExerciseTypeEnum.SECTION.enum,
            exerciseId: sectionMock.id,
            score: 179.08
        };
        expect(estimatedScores .length).toBe(3);
        expect(estimatedScores[2]).toEqual(jasmine.objectContaining(expectedEstimatedScore));


        //testing that same event will not be processed twice
        $rootScope.$broadcast(exerciseEventsConst.section.FINISH, sectionMock, resultMock, examMock);
        $rootScope.$digest();
        var estimatedScores = actions.getEstimatedScoresFromDb(sectionMock.subjectId);
        expect(estimatedScores .length).toBe(3);
        expect(estimatedScores[2]).toEqual(jasmine.objectContaining(expectedEstimatedScore));
    });
});
