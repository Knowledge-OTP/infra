xdescribe('testing service "StatsQuerySrv":', function () {
    'use strict';

    beforeEach(module('znk.infra.stats', 'htmlTemplates','storage.mock', 'testUtility', 'content.mock', 'categories.mock'));

    var $rootScope, StatsQuerySrv, SubjectEnum, StudentStorage;
    var actions;
    beforeEach(inject([
        '$injector',
        function ($injector) {
            $rootScope = $injector.get('$rootScope');
            StatsQuerySrv = $injector.get('StatsQuerySrv');
            SubjectEnum = $injector.get('SubjectEnum');

            var level1 = {
                id_0:{//weakness: 0.24
                    id: 0,
                    totalQuestions: 25,
                    correct: 15,
                    unanswered: 4,
                    wrong: 6,
                    totalTime: 0
                },
                id_1:{//weakness: 0.24
                    id: 1,
                    totalQuestions: 79,
                    correct: 65,
                    unanswered: 5,
                    wrong: 9,
                    totalTime: 0
                },
                id_2:{//weakness 0.41
                    id: 2,
                    totalQuestions: 29,
                    correct: 14,
                    unanswered: 3,
                    wrong: 12,
                    totalTime: 0
                }
            };

            var level2 = {
                id_263:{//weakness: 0.24
                    id: 263,
                    subjectId: 0,
                    totalQuestions: 25,
                    correct: 15,
                    unanswered: 4,
                    wrong: 6,
                    totalTime: 0,
                    parentsIds: [0]
                },
                id_266:{//weakness 0.076
                    id: 266,
                    subjectId: 1,
                    totalQuestions: 66,
                    correct: 57,
                    unanswered: 4,
                    wrong: 5,
                    totalTime: 0,
                    parentsIds: [1]
                },
                id_267:{//weakness 0.385
                    id: 267,
                    subjectId: 1,
                    totalQuestions: 13,
                    correct: 8,
                    unanswered: 1,
                    wrong: 4,
                    totalTime: 0,
                    parentsIds: [1]
                },
                id_271:{//weakness 0.517
                    id: 271,
                    subjectId: 2,
                    totalQuestions: 29,
                    correct: 14,
                    unanswered: 3,
                    wrong: 12,
                    totalTime: 0,
                    parentsIds: [2]
                }
            };

            var level3 = {
                id_20:{//weakness 0.6
                    id: 20,
                    subjectId: 0,
                    totalQuestions: 10,
                    correct: 4,
                    unanswered: 2,
                    wrong: 4,
                    totalTime: 0,
                    parentsIds: [263, 0]
                },
                id_23:{//weakness 0.266
                    id: 23,
                    subjectId: 0,
                    totalQuestions: 15,
                    correct: 11,
                    unanswered: 2,
                    wrong: 2,
                    totalTime: 0,
                    parentsIds: [263, 0]
                },
                id_75:{//weakness 0.121
                    id: 75,
                    subjectId: 1,
                    totalQuestions: 33,
                    correct: 29,
                    unanswered: 2,
                    wrong: 2,
                    totalTime: 0,
                    parentsIds: [266, 1]
                },
                id_76:{//weakness 0.151
                    id: 76,
                    subjectId: 1,
                    totalQuestions: 33,
                    correct: 28,
                    unanswered: 2,
                    wrong: 3,
                    totalTime: 0,
                    parentsIds: [266, 1]
                },
                id_85:{//weakness 0.385
                    id: 85,
                    subjectId: 1,
                    totalQuestions: 13,
                    correct: 8,
                    unanswered: 1,
                    wrong: 4,
                    totalTime: 0,
                    parentsIds: [267, 1]
                },
                id_93:{//weakness 0.517
                    id: 93,
                    subjectId: 2,
                    totalQuestions: 29,
                    correct: 14,
                    unanswered: 3,
                    wrong: 12,
                    totalTime: 0,
                    parentsIds: [271, 2]
                }
            };

            var TestUtilitySrv = $injector.get('TestUtilitySrv');
            TestUtilitySrv.general.printDebugLogs();

            var InfraConfigSrv = $injector.get('InfraConfigSrv');
            StudentStorage = TestUtilitySrv.general.asyncToSync(InfraConfigSrv.getStudentStorage, InfraConfigSrv)();
            StudentStorage.adapter.__db.users.$$uid.stats = {
                level1Categories: level1,
                level2Categories: level2,
                level3Categories: level3,
                usedExercises: []
            };

            actions = TestUtilitySrv.general.convertAllAsyncToSync(StatsQuerySrv);
        }]));

    it('when requesting for weakest category in level then the weakest category should be returned', function () {
        var LEVEL = 2;
        var weakestGeneralCategory = actions.getWeakestCategoryInLevel(LEVEL);
        var expectedResult = {
            id:271
        };
        expect(weakestGeneralCategory).toEqual(jasmine.objectContaining(expectedResult));
    });

    it('when requesting for weakest category in level and providing optional ids then weakest category from optional ids' +
        'should be returned',function(){
        var LEVEL = 3;
        var optionalIds = [76, 85, 93];
        var weakestCategory = actions.getWeakestCategoryInLevel(LEVEL, optionalIds);
        var expectedResult = {
            id: 93
        };
        expect(weakestCategory).toEqual(jasmine.objectContaining(expectedResult));
    });

    it('when requesting for weakest category under specific parent then one should be returned', function(){
        var parentId = 1;
        var LEVEL = 3;
        var weakestCategory = actions.getWeakestCategoryInLevel(LEVEL, null, parentId);
        var expectedResult = 85;
        expect(weakestCategory.id).toBe(expectedResult);
    });


    it('when requesting for weakest category under specific parent and providing optionalIds then the weakest of the optional should be returned', function(){
        var parentId = 1;
        var LEVEL = 3;
        var optionalCategories = [75, 76];
        var weakestCategory = actions.getWeakestCategoryInLevel(LEVEL, optionalCategories, parentId);
        var expectedResult = 76;
        expect(weakestCategory.id).toBe(expectedResult);
    });

    it('given no stats were recorded when requesting for weakest category under specific parent and providing optionalIds ' +
        'then a random one from the optional ids array should be returned', function(){
        delete StudentStorage.adapter.__db.users.$$uid.stats;
        var parentId = 1;
        var LEVEL = 3;
        var optionalCategories = [275, 277];
        var weakestCategory = actions.getWeakestCategoryInLevel(LEVEL, optionalCategories, parentId);
        expect(optionalCategories).toEqual(jasmine.arrayContaining([weakestCategory.id]));
    });
});
