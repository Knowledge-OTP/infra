describe('testing service "StatsSrv":', function () {
    'use strict';

    beforeEach(module('znk.infra.stats', 'htmlTemplates','storage.mock', 'testUtility'));

    beforeEach(module(function(StatsSrvProvider) {
        function getCategoryLookup($q) {
            return $q.when([]);
        }

        StatsSrvProvider.setCategoryLookup(getCategoryLookup);
    }));

    var $rootScope, StatsSrv,SubjectEnum;
    beforeEach(inject([
        '$injector',
        function ($injector) {
            $rootScope = $injector.get('$rootScope');
            StatsSrv = $injector.get('StatsSrv');
            SubjectEnum = $injector.get('SubjectEnum');

            var subjectStats = {
                0:{//weakness: 0.24
                    id: 0,
                    totalQuestions: 25,
                    correct: 15,
                    unanswered: 4,
                    wrong: 6,
                    totalTime: 0
                },
                1:{//weakness: 0.24
                    id: 1,
                    totalQuestions: 79,
                    correct: 65,
                    unanswered: 5,
                    wrong: 9,
                    totalTime: 0
                },
                2:{
                    totalQuestions: 29,
                    correct: 14,
                    unanswered: 3,
                    wrong: 12,
                    totalTime: 0
                }
            };

            var generalCategoryStats = {
                4:{//weakness: 0.24
                    id: 4,
                    subjectId: 0,
                    totalQuestions: 25,
                    correct: 15,
                    unanswered: 4,
                    wrong: 6,
                    totalTime: 0
                },
                8:{//weakness 0.076
                    id: 8,
                    subjectId: 1,
                    totalQuestions: 66,
                    correct: 57,
                    unanswered: 4,
                    wrong: 5,
                    totalTime: 0
                },
                11:{//weakness 0.385
                    id: 11,
                    subjectId: 1,
                    totalQuestions: 13,
                    correct: 8,
                    unanswered: 1,
                    wrong: 4,
                    totalTime: 0
                },
                12:{//weakness 0.517
                    id: 12,
                    subjectId: 2,
                    totalQuestions: 29,
                    correct: 14,
                    unanswered: 3,
                    wrong: 12,
                    totalTime: 0
                }
            };

            var specificCategoryStats = {
                20:{//weakness 0.6
                    id: 20,
                    generalCategoryId: 4,
                    subjectId: 0,
                    totalQuestions: 10,
                    correct: 4,
                    unanswered: 2,
                    wrong: 4,
                    totalTime: 0
                },
                23:{//weakness 0.266
                    id: 23,
                    generalCategoryId: 4,
                    subjectId: 0,
                    totalQuestions: 15,
                    correct: 11,
                    unanswered: 2,
                    wrong: 2,
                    totalTime: 0
                },
                75:{//weakness 0.121
                    id: 75,
                    generalCategoryId: 8,
                    subjectId: 1,
                    totalQuestions: 33,
                    correct: 29,
                    unanswered: 2,
                    wrong: 2,
                    totalTime: 0
                },
                76:{//weakness 0.091
                    id: 76,
                    generalCategoryId: 8,
                    subjectId: 1,
                    totalQuestions: 33,
                    correct: 28,
                    unanswered: 2,
                    wrong: 3,
                    totalTime: 0
                },
                85:{//weakness 0.385
                    id: 85,
                    generalCategoryId: 11,
                    subjectId: 1,
                    totalQuestions: 13,
                    correct: 8,
                    unanswered: 1,
                    wrong: 4,
                    totalTime: 0
                },
                93:{//weakness 0.517
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
                subjectStats: subjectStats,
                generalCategoryStats: generalCategoryStats,
                specificCategoryStats: specificCategoryStats,
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
            actions[fnName] = convertAsyncToSync(StatsSrv, fnName);
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
