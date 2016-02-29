describe('testing service "StatsQuerySrv":', function () {
    'use strict';

    beforeEach(module('znk.infra.stats', 'htmlTemplates','storage.mock', 'testUtility'));

    beforeEach(module(function(StatsSrvProvider) {
        function getCategoryLookup($q) {
            return $q.when(content.category);
        }

        StatsSrvProvider.setCategoryLookup(getCategoryLookup);
    }));

    var $rootScope, StatsQuerySrv, SubjectEnum;
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
                id_4:{//weakness: 0.24
                    id: 4,
                    subjectId: 0,
                    totalQuestions: 25,
                    correct: 15,
                    unanswered: 4,
                    wrong: 6,
                    totalTime: 0,
                    parentsIds: [0]
                },
                id_8:{//weakness 0.076
                    id: 8,
                    subjectId: 1,
                    totalQuestions: 66,
                    correct: 57,
                    unanswered: 4,
                    wrong: 5,
                    totalTime: 0,
                    parentsIds: [1]
                },
                id_11:{//weakness 0.385
                    id: 11,
                    subjectId: 1,
                    totalQuestions: 13,
                    correct: 8,
                    unanswered: 1,
                    wrong: 4,
                    totalTime: 0,
                    parentsIds: [1]
                },
                id_12:{//weakness 0.517
                    id: 12,
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
                    generalCategoryId: 4,
                    subjectId: 0,
                    totalQuestions: 10,
                    correct: 4,
                    unanswered: 2,
                    wrong: 4,
                    totalTime: 0,
                    parentsIds: [4, 0]
                },
                id_23:{//weakness 0.266
                    id: 23,
                    generalCategoryId: 4,
                    subjectId: 0,
                    totalQuestions: 15,
                    correct: 11,
                    unanswered: 2,
                    wrong: 2,
                    totalTime: 0,
                    parentsIds: [4, 0]
                },
                id_75:{//weakness 0.121
                    id: 75,
                    generalCategoryId: 8,
                    subjectId: 1,
                    totalQuestions: 33,
                    correct: 29,
                    unanswered: 2,
                    wrong: 2,
                    totalTime: 0,
                    parentsIds: [8, 1]
                },
                id_76:{//weakness 0.091
                    id: 76,
                    generalCategoryId: 8,
                    subjectId: 1,
                    totalQuestions: 33,
                    correct: 28,
                    unanswered: 2,
                    wrong: 3,
                    totalTime: 0,
                    parentsIds: [8, 1]
                },
                id_85:{//weakness 0.385
                    id: 85,
                    generalCategoryId: 11,
                    subjectId: 1,
                    totalQuestions: 13,
                    correct: 8,
                    unanswered: 1,
                    wrong: 4,
                    totalTime: 0,
                    parentsIds: [11, 1]
                },
                id_93:{//weakness 0.517
                    id: 93,
                    generalCategoryId: 12,
                    subjectId: 2,
                    totalQuestions: 29,
                    correct: 14,
                    unanswered: 3,
                    wrong: 12,
                    totalTime: 0,
                    parentsIds: [12, 2]
                }
            };

            var StorageSrv = $injector.get('testStorage');
            StorageSrv.db.users.$$uid.stats = {
                level1Categories: level1,
                level2Categories: level2,
                level3Categories: level3,
                usedExercises: []
            };

            var TestUtilitySrv = $injector.get('TestUtilitySrv');
            TestUtilitySrv.general.printDebugLogs();

            actions = TestUtilitySrv.general.convertAllAsyncToSync(StatsQuerySrv);
        }]));

    it('when requesting for weakest category in level then the weakest category should be returned', function () {
        var LEVEL = 2;
        var weakestGeneralCategory = actions.getWeakestCategoryInLevel(LEVEL);
        var expectedResult = {
            id:12
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
        var weakestCategory = actions.getWeakestCategoryInLevelUnderParent(parentId, LEVEL);
        var expectedResult = 85;
        expect(weakestCategory.id).toBe(expectedResult);
    });
});
