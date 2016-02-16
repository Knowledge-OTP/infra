describe('testing service "HintSrv":', function () {
    'use strict';

    beforeEach(module('znk.infra.hint', 'htmlTemplates', 'storage.mock', 'testUtility'));

    var hintSettings = {
        HINT_NAME: 'demoHint',
        hintActionGetter: function(){
            return function(){
                return hintSettings.hintAction.apply(this,arguments);
            }
        },
        hintAction: function(){
            return true;
        }
    };

    var hintSettings_2 = {
        HINT_NAME: 'demoHint_2',
        hintActionGetter: function(testStorage){
            return hintSettings_2.hintAction.bind(hintSettings_2, testStorage)
        },
        triggerFnGetter: function($timeout){
            return function(hintVal){
                return !hintVal || hintVal.value <5;
            }
        },
        hintAction: function(testStorage){
            var counterPath = 'counter';
            return testStorage.get(counterPath).then(function(counter){
                if(isNaN(counter)){
                    counter = 0;
                }
                counter++;
                testStorage.set(counterPath, counter);
                return counter;
            });
        }
    };

    beforeEach(module(function(HintSrvProvider){
         HintSrvProvider.registerHint(hintSettings.HINT_NAME, hintSettings.hintActionGetter);

        HintSrvProvider.registerHint(hintSettings_2.HINT_NAME, hintSettings_2.hintActionGetter, hintSettings_2.triggerFnGetter);
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
        spyOn(hintSettings,'hintAction');
        syncHintSrvActions.triggerHint(hintSettings.HINT_NAME);
        expect(hintSettings.hintAction).toHaveBeenCalled();
    });

    it('when triggering hint then it should be recorded in hint status object in db', function () {
        var HINT_VALUE = 'hint_value';
        hintSettings.hintAction = function(){
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

        spyOn(hintSettings,'hintAction');
        syncHintSrvActions.triggerHint(hintSettings.HINT_NAME);
        expect(hintSettings.hintAction).not.toHaveBeenCalled();
    });

    it('when triggering hint then it action function should be triggered with hint status', function () {
        spyOn(hintSettings_2,'hintAction').and.callThrough();
        for(var i=0; i<5; i++){
            syncHintSrvActions.triggerHint(hintSettings_2.HINT_NAME);
        }
        expect(hintSettings_2.hintAction).toHaveBeenCalled();
    });

    it('given determineWhetherToTriggerFn was defined and hint status is true when triggering hint then it should triggered', function () {
        var expectedVal = {
            value: false,
            date: testStorage.variables.currTimeStamp
        };
        testStorage.db.users.$$uid.hint.hintsStatus[hintSettings.HINT_NAME] = {
            name: hintSettings.HINT_NAME,
            history: [expectedVal]
        };
        spyOn(hintSettings,'hintAction');

        syncHintSrvActions.triggerHint(hintSettings.HINT_NAME);
        expect(hintSettings.hintAction).toHaveBeenCalledWith(expectedVal);
    });

    it('when triggering hints then it trigger and history should be recorded', function () {
        for(var i=0; i<5; i++){
            syncHintSrvActions.triggerHint(hintSettings_2.HINT_NAME);
        }
        var historyItemCount = testStorage.db.users.$$uid.hint.hintsStatus[hintSettings_2.HINT_NAME].history.length;
        expect(historyItemCount).toBe(5);
    });
});
