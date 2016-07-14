describe('testing service "CategoryService":', function () {
    'use strict';

    beforeEach(module('znk.infra.contentGetters',
        'htmlTemplates', 'testUtility'));

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
        }
    ]));

    xit('when requesting for a not exiting result then a new initialized result should be returned', function () {
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

});
