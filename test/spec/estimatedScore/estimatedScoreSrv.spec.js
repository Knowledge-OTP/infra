xdescribe('testing service "EstimatedScoreSrv":', function () {
    'use strict';

    beforeEach(module('znk.infra.estimatedScore', 'htmlTemplates', 'testUtility', 'storage.mock', 'estimatedScore.mock', 'znk.infra.presence', 'env.mock', 'user.mock', 'categories.mock'));

    var actions, TestUtilitySrv, $rootScope, StudentStorage, EstimatedScoreSrv, InfraConfigSrv, categoriesConstant;

    beforeEach(module(function (EstimatedScoreSrvProvider, EstimatedScoreEventsHandlerSrvProvider, exerciseTypeConst, $provide, PresenceServiceProvider) {

        $provide.service('EstimatedScoreHelperSrv', function($q) {
            this.getEstimatedScoreData = function() {
                return $q.when(StudentStorage.adapter.__db.users.$$uid.estimatedScore);
            };
        });

        // CallsEventsSrvProvider.enabled=true;

        PresenceServiceProvider.setAuthServiceName('AuthService');

    }));

    var notRoundEstimatedScoreMock = {
        0: [
            { score: 1.2 },
            { score: 1.7 }
        ],
        1: [
            { score: 2 },
            { score: 2.7 },
            { score: 3.4 }
        ],
        2: []
    };

    var roundEstimatedScoreMock = {
        0: [
            { score: 1 },
            { score: 2 }
        ],
        1: [
            { score: 2 },
            { score: 3 },
            { score: 3 }
        ],
        2: []
    };

    beforeEach(inject(
        function ($injector) {
            $rootScope = $injector.get('$rootScope');
            TestUtilitySrv = $injector.get('TestUtilitySrv');
            EstimatedScoreSrv = $injector.get('EstimatedScoreSrv');
            InfraConfigSrv = $injector.get('InfraConfigSrv');
            StudentStorage = TestUtilitySrv.general.asyncToSync(InfraConfigSrv.getStudentStorage, InfraConfigSrv)();
            categoriesConstant = $injector.get('categoriesConstant');

            TestUtilitySrv.general.printDebugLogs();

            actions = TestUtilitySrv.general.convertAllAsyncToSync(EstimatedScoreSrv);

            StudentStorage.adapter.__db.users.$$uid.estimatedScore = {
                estimatedScores: notRoundEstimatedScoreMock,
                exercisesRawScores: {}
            };
        }
    ));


    xit('when call getEstimatedScores then the function will use the notRoundEstimatedScoreMock object and converts the score of each subject array' +
        'to be exactly like roundEstimatedScoreMock and empty estimated score subject should return object instead of empty array', function () {
        var result = actions.getEstimatedScores();

        expect(result[0]).toEqual(jasmine.objectContaining(roundEstimatedScoreMock[0]));
        expect(result[1]).toEqual(jasmine.objectContaining(roundEstimatedScoreMock[1]));
        expect(result[2]).toEqual([]);
    });

    xit('when call getEstimatedScores with one subject then the function will use the notRoundEstimatedScoreMock object and converts the score of the subject array' +
        'to be exactly like roundEstimatedScoreMock[subject key]', function () {
        var result = actions.getEstimatedScores(0);
        expect(result).toEqual(jasmine.objectContaining(roundEstimatedScoreMock[0]));
    });

    xit('when call getEstimatedScores with one subject that does not have scores then it should return object instead of empty array', function () {
        var result = actions.getEstimatedScores(2);
        expect(result).toEqual({});
    });

   xit('when call getLatestEstimatedScore then the function will use the notRoundEstimatedScoreMock object and converts the score of each subject array' +
        'to be exactly like roundEstimatedScoreMock and empty estimated score subject should return object instead of empty array', function () {
        var result = actions.getLatestEstimatedScore();
        var lastInArrayZeroSubject = roundEstimatedScoreMock[0][[roundEstimatedScoreMock[0].length - 1]];
        var lastInArrayOneSubject = roundEstimatedScoreMock[1][[roundEstimatedScoreMock[1].length - 1]];

        expect(result[0].score).toEqual(lastInArrayZeroSubject.score);
        expect(result[1].score).toEqual(lastInArrayOneSubject.score);
        expect(result[2]).toEqual({});
    });

    xit('when call getLatestEstimatedScore with one subject then the function will use the notRoundEstimatedScoreMock object and converts the score of the subject array' +
        'to be exactly like roundEstimatedScoreMock[subject key]', function () {
        var result = actions.getLatestEstimatedScore(0);
        var lastInArrayZeroSubject = roundEstimatedScoreMock[0][[roundEstimatedScoreMock[0].length - 1]];
        expect(result.score).toEqual(lastInArrayZeroSubject.score);
    });

    xit('when call getLatestEstimatedScore with one subject that does not have scores then it should return object instead of empty array', function () {
        var result = actions.getLatestEstimatedScore(2);
        expect(result).toEqual({});
    });

});
