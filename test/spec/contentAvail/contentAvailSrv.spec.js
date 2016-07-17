describe('testing service "ContentAvailSrv":', function () {
    'use strict';

    var ContentAvailSrvProvider;
    beforeEach(module('znk.infra.contentAvail', 'htmlTemplates', 'storage.mock', 'testUtility' /*''devicePlatformSrv.mock'*/));

    var userSpecialsMap = false;
    beforeEach(function () {
        module(['ContentAvailSrvProvider', function (_ContentAvailSrvProvider) {
            ContentAvailSrvProvider = _ContentAvailSrvProvider;
            ContentAvailSrvProvider.setSpecials(['$q', function ($q) {
                return $q.when(userSpecialsMap);
            }]);
        }]);
    });

    var $rootScope, ContentAvailSrv, actions, StudentStorage, StorageSrv;
    beforeEach(inject([
        '$injector',
        function ($injector) {
            $rootScope = $injector.get('$rootScope');

            ContentAvailSrv = $injector.get('ContentAvailSrv');

            var TestUtilitySrv = $injector.get('TestUtilitySrv');

            var InfraConfigSrv = $injector.get('InfraConfigSrv');

            StorageSrv = $injector.get('StorageSrv');

            StudentStorage = TestUtilitySrv.general.asyncToSync(InfraConfigSrv.getStudentStorage, InfraConfigSrv)();

            var purchaseDataPath = StorageSrv.variables.appUserSpacePath + '/purchase';
            actions = TestUtilitySrv.general.convertAllAsyncToSync(ContentAvailSrv);
            actions.addSubscription = function () {
                var purchaseData = this.getPurchaseData();
                purchaseData.subscription.expiryDate = Date.now() + 1000 * 60 * 24 * 30;//one month
                StudentStorage.set(purchaseDataPath, purchaseData);
                $rootScope.$digest();
            };
            actions.getPurchaseData = function () {
                var purchaseData;
                StudentStorage.get(purchaseDataPath).then(function(_purchaseData){
                    purchaseData = _purchaseData;
                });
                $rootScope.$digest();
                return purchaseData;
            };
            actions.setFreeDaily = function (dailyOrder) {
                StudentStorage.adapter.__db.freeContent.daily = dailyOrder;
            };
            actions.setSpecials = function (specialObj) {
                StudentStorage.adapter.__db.freeContent.specials = specialObj;
            };
            actions.setFreeSection = function (examId, sectionId) {
                StudentStorage.adapter.__db.freeContent.exam['id_' + examId] = true;
                if (!StudentStorage.adapter.__db.freeContent.section) {
                    StudentStorage.adapter.__db.freeContent.section = {};
                }
                StudentStorage.adapter.__db.freeContent.section['id_' + sectionId] = true;
            };
            actions.setFreeExam = function (examId) {
                StudentStorage.adapter.__db.freeContent.exam['id_' + examId] = true;
            };
            actions.purchaseExam = function (examIdOrString) {
                var purchaseData = this.getPurchaseData();
                if (angular.isString(examIdOrString)) {
                    purchaseData.exam = examIdOrString;
                } else {
                    purchaseData.exam['id_' + examIdOrString] = true;
                }
            };
            actions.purchaseDaily = function (dailyOrder) {
                var purchaseData = this.getPurchaseData();
                purchaseData.daily = dailyOrder;
            };
            actions.setFreeTutorial = function (tutorialId) {
                if (!StudentStorage.adapter.__db.freeContent.tutorial) {
                    StudentStorage.adapter.__db.freeContent.tutorial = {};
                }
                StudentStorage.adapter.__db.freeContent.tutorial['id_' + tutorialId] = true;
            };
            actions.purchaseTutorial = function (tutorialIdOrAll) {
                var purchaseData = this.getPurchaseData();

                if (angular.isString(tutorialIdOrAll)) {
                    purchaseData.tutorial = tutorialIdOrAll;
                } else {
                    purchaseData.tutorial['id_' + tutorialIdOrAll] = true;
                }
            };
        }])
    );

    beforeEach(function () {
        StudentStorage.adapter.__db.users = {
            "$$uid": {
                "purchase": {
                    "daily": 0,
                    "exam": {},
                    "tutorial": {},
                    "subscription": {}
                }
            }
        };

        StudentStorage.adapter.__db.users.$$uid.purchase = {
            daily: 0,
            exam: {},
            tutorial: {},
            subscription: {}
        };

        StudentStorage.adapter.__db.freeContent = {
            daily: 0,
            exam: {},
            tutorial: {},
            subscription: {},
            specials: {}
        };
    });

    it('when user has subscription then hasSubscription should return true', function () {
        expect(actions.hasSubscription()).toBeFalsy();
        actions.addSubscription();
        expect(actions.hasSubscription()).toBeTruthy();
    });

    it('when user has subscription then isDailyAvail should return true for all dailies', function () {
        expect(actions.isDailyAvail(3)).toBeFalsy();
        actions.addSubscription();
        expect(actions.isDailyAvail(3)).toBeTruthy();
    });

    it('given only first daily is free when asking if avail daily should return true only for daily 1', function () {
        actions.setFreeDaily(1);
        expect(actions.isDailyAvail(2)).toBeFalsy();
        expect(actions.isDailyAvail(1)).toBeTruthy();
    });

    it('given user without purchased exams and without subscription when checking if available section then only return true it free', function () {
        actions.setFreeSection(25, 1116);
        expect(actions.isSectionAvail(25, 11)).toBeFalsy();
        expect(actions.isSectionAvail(25, 1116)).toBeTruthy();
    });

    it('when user has subscription then isSectionAvail should return true for all sections', function () {
        StudentStorage;
        actions.addSubscription();
        expect(actions.isSectionAvail(25, 11)).toBeTruthy();
        expect(actions.isSectionAvail(3, 1116)).toBeTruthy();
        expect(actions.isSectionAvail(25, 1116)).toBeTruthy();
    });

    it('given user with purchased exams when checking if available section then return true if exam was purchased', function () {
        actions.purchaseExam(30);
        expect(actions.isSectionAvail(30, 11)).toBeTruthy();
        expect(actions.isSectionAvail(30, 1116)).toBeTruthy();
        expect(actions.isSectionAvail(25, 1141)).toBeFalsy();
        expect(actions.isSectionAvail(55, 1113)).toBeFalsy();
    });

    it('given only exam id 25 is free when asking if avail exam should return true only for exam 25', function () {
        actions.setFreeExam(25);
        expect(actions.isExamAvail(25)).toBeTruthy();
        expect(actions.isExamAvail(23)).toBeFalsy();
    });

    it('given user has subscription when asking isExamAvail then should return true for all exam ids', function () {
        expect(actions.isExamAvail(3)).toBeFalsy();
        actions.addSubscription();
        expect(actions.isExamAvail(3)).toBeTruthy();
    });

    it('given user purchased daily bundle and free daily is 1 when checking if daily available then only purchased or free dailies should be available', function () {
        actions.setFreeDaily(1);
        expect(actions.isDailyAvail(2)).toBeFalsy();
        actions.purchaseDaily(4);
        expect(actions.isDailyAvail(1)).toBeTruthy();
        expect(actions.isDailyAvail(5)).toBeTruthy();
        expect(actions.isDailyAvail(6)).toBeFalsy();
    });

    it('given user purchased all dailies when checking if daily available then should return true for all the dailies', function () {
        actions.purchaseDaily('all');
        expect(actions.isDailyAvail(1)).toBeTruthy();
        expect(actions.isDailyAvail(6)).toBeTruthy();
    });

    it('given user purchased exam with id 30 when asking if exam available then should return true only for exam 30', function () {
        actions.purchaseExam(30);
        expect(actions.isExamAvail(30)).toBeTruthy();
        expect(actions.isExamAvail(35)).toBeFalsy();
    });

    it('given user purchased all exams when asking if exam available then should always return true', function () {
        actions.purchaseExam('all');
        expect(actions.isExamAvail(30)).toBeTruthy();
        expect(actions.isExamAvail(35)).toBeTruthy();
    });

    it('when user has subscription then isTutorialAvail should return true for all tutorial', function () {
        expect(actions.isTutorialAvail(10)).toBeFalsy();
        actions.addSubscription();
        expect(actions.isTutorialAvail(10)).toBeTruthy();
    });

    it('when user has no subscription neither purchased tutorials then when asking if tutorial avail true should be returned' +
        'only for the free tutorials', function () {
        actions.setFreeTutorial(15);
        expect(actions.isTutorialAvail(17)).toBeFalsy();
        expect(actions.isTutorialAvail(15)).toBeTruthy();
    });

    it('when user has purchased a tutorial then when asking if it avail it should return true', function () {
        expect(actions.isTutorialAvail(20)).toBeFalsy();
        expect(actions.isTutorialAvail(30)).toBeFalsy();

        actions.purchaseTutorial(20);
        expect(actions.isTutorialAvail(20)).toBeTruthy();

        actions.purchaseTutorial(30);
        expect(actions.isTutorialAvail(30)).toBeTruthy();

        expect(actions.isTutorialAvail(40)).toBeFalsy();
    });

    it('when user has purchased all tutorials then when asking if tutorial is avail should always true should', function () {
        expect(actions.isTutorialAvail(20)).toBeFalsy();
        actions.purchaseTutorial('all');
        expect(actions.isTutorialAvail(20)).toBeTruthy();
        expect(actions.isTutorialAvail(30)).toBeTruthy();
    });

    it('when user has specials with one key that has daily:1 then isDailyAvail should return true for one daily more then free content daily num', function () {
        userSpecialsMap = {
            socialSharing: true,
            someThingTrue: true,
            someThingFalse: false
        };
        actions.setSpecials({
            socialSharing: {
                daily: 1
            }
        });
        expect(actions.isDailyAvail(1)).toBeTruthy();
    });

    it('when user has specials with several keys then isDailyAvail should return true for sum of all dailies that user has true in config phase', function () {
        userSpecialsMap = {
            socialSharing: true,
            someThingTrue: true,
            someThingFalse: false
        };
        actions.setSpecials({
            socialSharing: {
                daily: 1
            },
            someThingTrue: {
                daily: 2
            },
            someThingFalse: {
                daily: 2 // return false from config phase, shouldn't be counted
            }
        });
        expect(actions.isDailyAvail(3)).toBeTruthy();
        expect(actions.isDailyAvail(4)).toBeFalsy();
    });


    it('when user has specials exam then isExamAvail should return true for one exam in socialSharing', function () {
        userSpecialsMap = {
            socialSharing: true,
            someThingTrue: true,
            someThingFalse: false
        };
        actions.setSpecials({
            socialSharing: {
                exam: {
                    id_1: true
                }
            }
        });
        expect(actions.isExamAvail(1)).toBeTruthy();
        expect(actions.isExamAvail(25)).toBeFalsy();
    });

    it('when user has specials exam then isExamAvail should return true for some exams in specials', function () {
        userSpecialsMap = {
            socialSharing: true,
            someThingTrue: true,
            someThingFalse: false
        };
        actions.setSpecials({
            socialSharing: {
                exam: {
                    id_1: true
                }
            },
            someThingTrue: {
                exam: {
                    id_2: true
                }
            },
            someThingFalse: {
                exam: {
                    id_3: true
                } // return false from config phase, shouldn't be counted
            }
        });
        expect(actions.isExamAvail(1)).toBeTruthy();
        expect(actions.isExamAvail(2)).toBeTruthy();
        expect(actions.isExamAvail(3)).toBeFalsy();
    });

    it('when user has specials section then isSectionAvail should return true for one section in socialSharing', function () {
        userSpecialsMap = {
            socialSharing: true,
            someThingTrue: true,
            someThingFalse: false
        };
        actions.setSpecials({
            socialSharing: {
                section: {
                    id_1111: true
                }
            },
            someThingTrue: {
                section: {
                    id_2222: false
                }
            },
            someThingFalse: {
                section: {
                    id_3333: true
                } // return false from config phase, shouldn't be counted
            }
        });
        expect(actions.isSectionAvail(1, 1111)).toBeTruthy();
        expect(actions.isSectionAvail(2, 2222)).toBeFalsy();
        expect(actions.isSectionAvail(3, 7777)).toBeFalsy();
    });

    it('when user has specials tutorial then isTutorialAvail should return true for one tutorial in specials', function () {
        userSpecialsMap = {
            socialSharing: true,
            someThingTrue: true,
            someThingFalse: false
        };
        actions.setSpecials({
            socialSharing: {
                tutorial: {
                    id_1: true
                }
            },
            someThingTrue: {
                tutorial: {
                    id_2: false
                }
            },
            someThingFalse: {
                tutorial: {
                    id_3: true
                } // return false from config phase, shouldn't be counted
            }
        });
        // isTutorialAvail
        expect(actions.isTutorialAvail(1)).toBeTruthy();
        expect(actions.isTutorialAvail(2)).toBeFalsy();
        expect(actions.isTutorialAvail(3)).toBeFalsy();
    });
});
