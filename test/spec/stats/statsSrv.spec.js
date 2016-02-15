xdescribe('testing service "StatsQuerySrv":', function () {
    'use strict';

    beforeEach(module('znk.infra.stats', 'htmlTemplates','storage.mock', 'testUtility'));

    beforeEach(module(function(StatsQuerySrvProvider) {
        function getCategoryLookup($q) {
            return $q.when([]);
        }

        StatsQuerySrvProvider.setCategoryLookup(getCategoryLookup);
    }));

    var $rootScope, StatsQuerySrv, SubjectEnum;
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
                id_2:{
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
                    totalTime: 0
                },
                id_8:{//weakness 0.076
                    id: 8,
                    subjectId: 1,
                    totalQuestions: 66,
                    correct: 57,
                    unanswered: 4,
                    wrong: 5,
                    totalTime: 0
                },
                id_11:{//weakness 0.385
                    id: 11,
                    subjectId: 1,
                    totalQuestions: 13,
                    correct: 8,
                    unanswered: 1,
                    wrong: 4,
                    totalTime: 0
                },
                id_12:{//weakness 0.517
                    id: 12,
                    subjectId: 2,
                    totalQuestions: 29,
                    correct: 14,
                    unanswered: 3,
                    wrong: 12,
                    totalTime: 0
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
                    totalTime: 0
                },
                id_23:{//weakness 0.266
                    id: 23,
                    generalCategoryId: 4,
                    subjectId: 0,
                    totalQuestions: 15,
                    correct: 11,
                    unanswered: 2,
                    wrong: 2,
                    totalTime: 0
                },
                id_75:{//weakness 0.121
                    id: 75,
                    generalCategoryId: 8,
                    subjectId: 1,
                    totalQuestions: 33,
                    correct: 29,
                    unanswered: 2,
                    wrong: 2,
                    totalTime: 0
                },
                id_76:{//weakness 0.091
                    id: 76,
                    generalCategoryId: 8,
                    subjectId: 1,
                    totalQuestions: 33,
                    correct: 28,
                    unanswered: 2,
                    wrong: 3,
                    totalTime: 0
                },
                id_85:{//weakness 0.385
                    id: 85,
                    generalCategoryId: 11,
                    subjectId: 1,
                    totalQuestions: 13,
                    correct: 8,
                    unanswered: 1,
                    wrong: 4,
                    totalTime: 0
                },
                id_93:{//weakness 0.517
                    id: 93,
                    generalCategoryId: 12,
                    subjectId: 2,
                    totalQuestions: 29,
                    correct: 14,
                    unanswered: 3,
                    wrong: 12,
                    totalTime: 0
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
        }]));

    //todo(igor) we need to transfer it to external utility service.
    var actions = {};
    function convertAsyncToSync(obj, fnName) {
        return function () {
            var res;
            obj[fnName].apply(obj, arguments).then(function (_res) {
                res = _res;
            });
            $rootScope.$digest();
            return res;
        };
    }
    var convertFnToSync = [
        'getWeakestGeneralCategory',
        'getWeakestSpecificCategory'
    ];
    actions.init = function () {
        convertFnToSync.forEach(function (fnName) {
            actions[fnName] = convertAsyncToSync(StatsQuerySrv, fnName);
        });
    };
    beforeEach(function () {
        actions.init();
    });

    it('when requesting for weakest general category then the weakest should be returned depend on the given optional general categories', function () {
        var weakestGeneralCategory = actions.getWeakestGeneralCategory({
            0: [4],
            1: [8,11],
            2: [12]
        });//[4,6,8,9,13]
        var expectedResult = {//weakness 0.7
            id:12
        };
        expect(weakestGeneralCategory).toEqual(jasmine.objectContaining(expectedResult));
    });

    it('given optional general categories not exists in stats object when requesting for weakst general category then all optional specific categories ' +
        'should be initialized',function(){
        var weakestGeneralCategory = actions.getWeakestGeneralCategory({
            0: [5,7]

        });
        expect(weakestGeneralCategory).toBeDefined();
        expect(weakestGeneralCategory.subjectId).toBe(SubjectEnum.MATH.enum);
    });

    it('when requesting weakest specific category then the weakest should be returned depend on the given optional general categories', function () {
        var weakestSpecificCategory = actions.getWeakestSpecificCategory({
            0:{
                4: [20,23]
            },
            1: {
                8: [75],
                11: [85]
            },
            2: {
                12: [93]
            }
        });
        var expectedResult = {
            id: 20
        };
        expect(weakestSpecificCategory).toEqual(jasmine.objectContaining(expectedResult));
    });

    it('given optional general categories not exists in stats object when requesting for weakest general category then all optional specific categories ' +
        'should be initialized',function(){
        var weakestGeneralCategory = actions.getWeakestGeneralCategory({
            0: [5,7]
        });
        expect(weakestGeneralCategory).toBeDefined();
        expect(weakestGeneralCategory.subjectId).toBe(SubjectEnum.MATH.enum);
    });

    it('given optional specific categories not exists in stats object when requesting for weakest specific category then all optional specific categories ' +
        'should be initialized',function(){
        var weakestSpecificCategory = actions.getWeakestSpecificCategory({
            2:{
                12: [88,89,90,91]
            }
        });
        expect(weakestSpecificCategory).toBeDefined();
        expect(weakestSpecificCategory.subjectId).toBe(SubjectEnum.WRITING.enum);
    });
});
