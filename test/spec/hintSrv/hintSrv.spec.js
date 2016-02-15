describe('testing service "HintSrv":', function () {
    'use strict';

    beforeEach(module('znk.infra.hint', 'htmlTemplates', 'storage.mock', 'testUtility'));

    var hintSettings = {
        HINT_NAME: 'demoHint',
        hintAction: function(){
            return hintSettings.hintActionProxy.apply(this,arguments);
        },
        hintActionProxy: function(){
            return true;
        }
    };

    var hintSettings_2 = {
        HINT_NAME: 'demoHint_2',
        hintAction: angular.noop,
        counter: 0,
            triggerFn: function(hintVal){
                hintSettings_2.counter++;
        }
    };

    beforeEach(module(function(HintSrvProvider){
        HintSrvProvider.registerHint(hintSettings.HINT_NAME, hintSettings.hintAction);

        HintSrvProvider.registerHint(hintSettings_2.HINT_NAME, hintSettings_2.hintAction, hintSettings_2.triggerFn);
    }));

    var syncHintSrvActions;
    var $rootScope, HintSrv, TestUtilitySrv, testStorage, $q;
    beforeEach(inject([
        '$injector',
        function ($injector) {
            $rootScope = $injector.get('$rootScope');
            HintSrv = $injector.get('HintSrv');
            TestUtilitySrv = $injector.get('TestUtilitySrv');
            testStorage = $injector.get('testStorage');
            $q = $injector.get('$q');

            syncHintSrvActions = TestUtilitySrv.general.convertAllAsyncToSync(HintSrv);

            testStorage.db.users.$$uid.hint = {
                hintsStatus:{}
            };
        }]));

    it('when registering hint then it should be able to trigger it', function () {
        spyOn(hintSettings,'hintActionProxy');
        syncHintSrvActions.triggerHint(hintSettings.HINT_NAME);
        expect(hintSettings.hintActionProxy).toHaveBeenCalled();
    });

    it('when triggering hint then it should be recorded in hint status object in db', function () {
        var HINT_VALUE = 'hint_value';
        hintSettings.hintActionProxy = function(){
            return $q.when(HINT_VALUE)
        };

        syncHintSrvActions.triggerHint(hintSettings.HINT_NAME);

        var expectedResult = {
            name: hintSettings.HINT_NAME,
            history: [{
                value: HINT_VALUE,
                date: testStorage.variables.currTimeStamp
            }]
        };
        var currentHintVal = testStorage.db.users.$$uid.hint.hintsStatus[hintSettings.HINT_NAME];
        expect(currentHintVal).toEqual(expectedResult);
    });

    it('given determineWhetherToTriggerFn was not defined and hint status is true when triggering hint then it should not be triggered', function () {
        testStorage.db.users.$$uid.hint.hintsStatus[hintSettings.HINT_NAME] = {
            name: hintSettings.HINT_NAME,
            history: [{
                value: true,
                date: testStorage.variables.currTimeStamp
            }]
        };

        spyOn(hintSettings,'hintActionProxy');
        syncHintSrvActions.triggerHint(hintSettings.HINT_NAME);
        expect(hintSettings.hintActionProxy).not.toHaveBeenCalled();
    });

    it('given determineWhetherToTriggerFn was defined and hint status is true when triggering hint then it should triggered', function () {
        testStorage.db.users.$$uid.hint.hintsStatus[hintSettings_2.HINT_NAME] = {
            name: hintSettings_2.HINT_NAME,
            history: [{
                value: true,
                date: testStorage.variables.currTimeStamp
            }]
        };

        var testCounter = 5;
        for(var i=0; i<testCounter; i++){
            syncHintSrvActions.triggerHint(hintSettings_2.HINT_NAME);
        }
        expect(hintSettings_2.counter).toBe(testCounter);
    });
});
