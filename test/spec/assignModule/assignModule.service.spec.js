describe('testing service "AssignModule":', function () {
    'use strict';

    beforeEach(module('znk.infra.assignModule',
        'htmlTemplates', 'testUtility','znk.infra.znkModule', 'znk.infra.storage', 'storage.mock', 'user.mock'));

    var UserAssignModuleService,ZnkModuleService, ModuleResultsService, SubjectEnum, $q, actions;
    beforeEach(inject([
        '$injector',
        function ($injector) {
        	UserAssignModuleService = $injector.get('UserAssignModuleService');
            ZnkModuleService = $injector.get('ZnkModuleService');
            ModuleResultsService = $injector.get('ModuleResultsService');
            SubjectEnum = $injector.get('SubjectEnum');
            $q = $injector.get('$q');
            
            var TestUtilitySrv = $injector.get('TestUtilitySrv');
            actions = TestUtilitySrv.general.convertAllAsyncToSync(UserAssignModuleService);
        }]));

    // beforeEach(function () {
    //     testStorage.db.exerciseResults = {};
    //     testStorage.db.examResults = {};
    //     testStorage.db.users = {
    //         '$$uid': {
    //             exerciseResults: {},
    //             examResults: {},
    //             exercisesStatus:{}
    //         }
    //     };
    // });
	
	it('test init service', function () {
		var uid=100;
        // var expectedExerciseResult = {
        //     exerciseId: exerciseId,
        //     exerciseTypeId: ExerciseTypeEnum.TUTORIAL.enum,
        //     questionResults: []
        // };

		var assignModules = UserAssignModuleService.getUserAssignModules(uid);

        expect(assignModules).toEqual([]);
        
    });
    

    // describe('testing exercise result', function () {
    //     it('when requesting for a not exiting result then a new initialized result should be returned', function () {
    //         var exerciseId = 20;
    //         var exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.TUTORIAL.enum, exerciseId);
    //         var expectedExerciseResult = {
    //             exerciseId: exerciseId,
    //             exerciseTypeId: ExerciseTypeEnum.TUTORIAL.enum,
    //             questionResults: []
    //         };
    //         expect(exerciseResult).toEqual(jasmine.objectContaining(expectedExerciseResult));
    //         expect(_isValidStartedTime(exerciseResult.startedTime)).toBeTruthy();
    //     });

    //     it('when requesting for a not exiting result with dont initialize pararmter then a new result should not be created ' +
    //         'and null should be returned', function () {
    //         var exerciseId = 20;
    //         var dontInitIfNotExists = true;
    //         var exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.TUTORIAL.enum, exerciseId, undefined, undefined, dontInitIfNotExists);
    //         expect(exerciseResult).toBeNull();
    //         expect(testStorage.db.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum]).toBeUndefined();
    //     });

    //     it('when requesting for a not exiting result then a new initialized result should be saved in db', function () {
    //         var exerciseId = 10;
    //         actions.getExerciseResult(ExerciseTypeEnum.TUTORIAL.enum, exerciseId);
    //         var expectedResultGuid = Object.keys(testStorage.db.exerciseResults)[0];
    //         var exerciseResultGuid = testStorage.db.users.$$uid.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum][exerciseId];
    //         expect(exerciseResultGuid).toBe(expectedResultGuid);
    //     });

    //     it('when requesting for an exiting result then it should be returned', function () {
    //         var exerciseId = 10;
    //         var questionGuid = 123;

    //         var result = {
    //             exerciseId: exerciseId,
    //             exerciseTypeId: ExerciseTypeEnum.TUTORIAL.enum,
    //             guid: questionGuid
    //         };

    //         var expectedResult = angular.copy(result);
    //         expectedResult.questionResults = [];

    //         testStorage.db.exerciseResults[questionGuid] = result;
    //         testStorage.db.users.$$uid.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum] = {};
    //         testStorage.db.users.$$uid.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum][exerciseId] = questionGuid;

    //         var exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.TUTORIAL.enum, exerciseId);
    //         expect(exerciseResult).toEqual(jasmine.objectContaining(expectedResult));
    //         expect(_isValidStartedTime(exerciseResult.startedTime)).toBeTruthy();
    //     });

    //     it('when requesting for an exiting result which has user answers then it should be returned', function () {
    //         var exerciseId = 10;
    //         var questionGuid = 123;

    //         var result = {
    //             exerciseId: exerciseId,
    //             exerciseTypeId: ExerciseTypeEnum.TUTORIAL.enum,
    //             guid: questionGuid,
    //             questionResults: [{
    //                 userAnswer: 1
    //             }]
    //         };

    //         var expectedResult = angular.copy(result);

    //         testStorage.db.exerciseResults[questionGuid] = result;
    //         testStorage.db.users.$$uid.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum] = {};
    //         testStorage.db.users.$$uid.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum][exerciseId] = questionGuid;

    //         var exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.TUTORIAL.enum, exerciseId);
    //         expect(exerciseResult).toEqual(jasmine.objectContaining(expectedResult));
    //         expect(_isValidStartedTime(exerciseResult.startedTime)).toBeTruthy();
    //     });

    //     it('when saving result then it should be saved in db', function () {
    //         var exerciseId = 10;
    //         var expectedResult = actions.getExerciseResult(ExerciseTypeEnum.TUTORIAL.enum, exerciseId);
    //         expectedResult.questionResults.push({userAnswer: 2});
    //         expectedResult.$save();
    //         $rootScope.$digest();

    //         var guid = testStorage.db.users.$$uid.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum][exerciseId];
    //         var exerciseResult = testStorage.db.exerciseResults[guid];

    //         delete expectedResult.$save;
    //         angular.forEach(expectedResult, function(value, key){
    //             expect(exerciseResult[key]).toEqual(value);
    //         });
    //     });

    //     it('when requesting for result and it not exist although the guid exists then it should be set to init result', function () {
    //         var exerciseId = 10;

    //         testStorage.db.users.$$uid.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum] = {};
    //         testStorage.db.users.$$uid.exerciseResults[ExerciseTypeEnum.TUTORIAL.enum][exerciseId] = 123;

    //         var exerciseResult = actions.getExerciseResult(ExerciseTypeEnum.TUTORIAL.enum, exerciseId);
    //         var expectedExerciseResult = {
    //             exerciseId: exerciseId,
    //             exerciseTypeId: ExerciseTypeEnum.TUTORIAL.enum,
    //             questionResults: []
    //         };
    //         expect(exerciseResult).toEqual(jasmine.objectContaining(expectedExerciseResult));
    //         expect(_isValidStartedTime(exerciseResult.startedTime)).toBeTruthy();
    //     });
    // });

    

});