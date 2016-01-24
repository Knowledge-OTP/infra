describe('testing service "ContentAvailSrv":', function () {
    'use strict';

    beforeEach(module('znk.infra.contentAvail', 'htmlTemplates','storage.mock', 'testUtility' /*''devicePlatformSrv.mock'*/));

    var $rootScope, ContentAvailSrv,StorageSrv,actions, DevicePlatformSrv, /*DevicePlatformEnum,*/ AppRateStatusEnum, TestStorage;
    beforeEach(inject([
        '$injector',
        function ($injector) {
            $rootScope = $injector.get('$rootScope');
            ContentAvailSrv = $injector.get('ContentAvailSrv');
            TestStorage = $injector.get('testStorage');
            //DevicePlatformSrv = $injector.get('DevicePlatformSrv');
            //DevicePlatformEnum = $injector.get('DevicePlatformEnum');
            //AppRateStatusEnum = $injector.get('AppRateStatusEnum');

            var $q = $injector.get('$q');

            TestStorage.db.users.$$uid.purchase = {
                daily: 0,
                exam: {},
                tutorial: {},
                subscription: {}
            };

            TestStorage.db.freeContent = {
                daily: 0,
                exam: {},
                tutorial: {},
                subscription: {}
            };

            var TestUtilitySrv = $injector.get('TestUtilitySrv');
            actions = TestUtilitySrv.general.convertAllAsyncToSync(ContentAvailSrv);
            actions.addSubscription = function(){
                var purchaseData = this.getPurchaseData();
                purchaseData.subscription.expiryDate = Date.now() + 1000 * 60 * 24 * 30;//one month
            };
            actions.getPurchaseData = function(){
                var purchaseData;
                var purchaseDataPath = TestStorage.variables.appUserSpacePath + '/purchase';
                TestStorage.get(purchaseDataPath).then(function(_purchaseData){
                    purchaseData = _purchaseData;
                });
                $rootScope.$digest();
                return purchaseData;
            };
            actions.setFreeDaily = function(dailyOrder){
                TestStorage.db.freeContent.daily = dailyOrder;
            };
            actions.setFreeSection = function(examId, sectionId){
                if(!TestStorage.db.freeContent.exam['id_' + examId]){
                    TestStorage.db.freeContent.exam['id_' + examId] = {
                        sections:{}
                    };
                }
                TestStorage.db.freeContent.exam['id_' + examId].sections['id_' + sectionId] = true;
            };
            actions.purchaseExam = function(examIdOrString){
                var purchaseData = this.getPurchaseData();
                if(angular.isString(examIdOrString)){
                    purchaseData.exam = examIdOrString;
                }else{
                    purchaseData.exam['id_' + examIdOrString] = true;
                }
            };
            actions.purchaseDaily = function(dailyOrder){
                var purchaseData = this.getPurchaseData();
                purchaseData.daily = dailyOrder;
            };
        }])
    );

    it('when user has subscription then hasSubscription should return true', function () {
        expect(actions.hasSubscription()).toBeFalsy();
        actions.addSubscription();
        expect(actions.hasSubscription()).toBeTruthy();
    });

    it('when user has subscription then isDailyAvail should return true for all dailies',function(){
        expect(actions.isDailyAvail(3)).toBeFalsy();
        actions.addSubscription();
        expect(actions.isDailyAvail(3)).toBeTruthy();
    });

    it('given only first daily is free when asking if avail daily should return true only for daily 1',function(){
        actions.setFreeDaily(1);
        expect(actions.isDailyAvail(2)).toBeFalsy();
        expect(actions.isDailyAvail(1)).toBeTruthy();
    });

    it('given user without purchased exams and without subscription when checking if available section then only return true of it free',function(){
        actions.setFreeSection(25,1116);
        expect(actions.isSectionAvail(25,11)).toBeFalsy();
        expect(actions.isSectionAvail(3,1116)).toBeFalsy();
        expect(actions.isSectionAvail(25,1116)).toBeTruthy();
    });

    it('when user has subscription then isSectionAvail should return true for all sections',function(){
        actions.addSubscription();
        expect(actions.isSectionAvail(25,11)).toBeTruthy();
        expect(actions.isSectionAvail(3,1116)).toBeTruthy();
        expect(actions.isSectionAvail(25,1116)).toBeTruthy();
    });

    it('given user with purchased exams when checking if available section then return true if exam was purchased',function(){
        actions.purchaseExam(30);
        expect(actions.isSectionAvail(30,11)).toBeTruthy();
        expect(actions.isSectionAvail(30,1116)).toBeTruthy();
        expect(actions.isSectionAvail(25,1141)).toBeFalsy();
        expect(actions.isSectionAvail(55,1113)).toBeFalsy();
    });

    it('given only exam id 25 is free when asking if avail exam should return true only for exam 25',function(){
        actions.setFreeSection(25,1116);
        expect(actions.isExamAvail(25)).toBeTruthy();
        expect(actions.isExamAvail(23)).toBeFalsy();
    });

    it('given user has subscription when asking isExamAvail then should return true for all exam ids',function(){
        expect(actions.isExamAvail(3)).toBeFalsy();
        actions.addSubscription();
        expect(actions.isExamAvail(3)).toBeTruthy();
    });

    it('given user purchased daily bundle and free daily is 1 when checking if daily available then only purchased or free dailies should be available',function(){
        actions.setFreeDaily(1);
        actions.purchaseDaily(4);
        expect(actions.isDailyAvail(1)).toBeTruthy();
        expect(actions.isDailyAvail(4)).toBeTruthy();
        expect(actions.isDailyAvail(5)).toBeTruthy();
        expect(actions.isDailyAvail(6)).toBeFalsy();
    });

    it('given user purchased all dailies when checking if daily available then should return true for all the dailies',function(){
        actions.purchaseDaily('all');
        expect(actions.isDailyAvail(1)).toBeTruthy();
        expect(actions.isDailyAvail(6)).toBeTruthy();
    });

    it('given user purchased exam with id 30 when asking if exam available then should return true only for exam 30',function(){
        actions.purchaseExam(30);
        expect(actions.isExamAvail(30)).toBeTruthy();
        expect(actions.isExamAvail(35)).toBeFalsy();
    });

    it('given user purchased all exams when asking if exam available then should always return true',function(){
        actions.purchaseExam('all')
        expect(actions.isExamAvail(30)).toBeTruthy();
        expect(actions.isExamAvail(35)).toBeTruthy();
    });

    xit('given user has review the app when asking for free content which blocked by app rate then it should be available',function(){
        StorageSrv.__appUserData.hint ={
            hintsStatus:{
                appRate: AppRateStatusEnum.rate.enum
            }
        };
        expect(actions.isSectionAvail(25,1141)).toBeTruthy();
        expect(actions.isSectionAvail(25,1164)).toBeTruthy();
        expect(actions.isSectionAvail(25,1181)).toBeTruthy();
    });
});
