(function (angular) {
    'use strict';

    angular.module('znk.infra.hint').provider('HintSrv',function(){

        var registeredHints = {};
        function defaultDetermineWhetherToTriggerFn(hintVal){
            return !(angular.isDefined(hintVal) && hintVal.value);
        }

        this.registerHint = function (hintName, hintAction, determineWhetherToTriggerFn) {
            if(!registeredHints[hintName]){
                registeredHints[hintName] = {
                    name: hintName,
                    action: hintAction,
                    determineWhetherToTrigger: determineWhetherToTriggerFn || defaultDetermineWhetherToTriggerFn
                };
            }
        };

        this.$get = [
            'InfraConfigSrv', '$q', '$log',
            function (InfraConfigSrv, $q, $log) {
                var HintSrv = {};
                var StorageSrv = InfraConfigSrv.getStorageService();
                var hintPath = StorageSrv.variables.appUserSpacePath + '/hint';

                HintSrv.triggerHint = function (hintName) {
                    var hintData = registeredHints[hintName];
                    if(!hintData){
                        $log.error('HintSrv: the following hint is not registered ' + hintName);
                    }
                    return getHints().then(function(hints){
                        var hintsStatus = hints.hintsStatus;
                        var hintLastVal = getHintLastValue(hintsStatus[hintName]);
                        return $q.when(hintData.determineWhetherToTrigger(hintLastVal)).then(function(shouldBeTriggered){
                            if(shouldBeTriggered){
                                return $q.when(hintData.action()).then(function(result){
                                    hintsStatus[hintName] = {
                                        name: hintName,
                                        history: [{
                                            value: angular.isUndefined(result) ? true : result,
                                            date: StorageSrv.variables.currTimeStamp
                                        }]
                                    };
                                    hints.hintsStatus = hintsStatus;
                                    saveHints(hints);

                                    return result;
                                });
                            }
                        });
                    });
                };

                function getHints(){
                    return StorageSrv.get(hintPath).then(function (hint) {
                        var defaultValues = {
                            hintsStatus:{

                            }
                        };

                        for(var prop in defaultValues){
                            if(angular.isUndefined(hint[prop])){
                                hint[prop] = defaultValues[prop];
                            }
                        }

                        return hint;
                    });
                }

                function saveHints(newHint){
                    return StorageSrv.set(hintPath, newHint);
                }

                function getHintLastValue(hintStatus){
                    return hintStatus && hintStatus.history && hintStatus.history.length && hintStatus.history[hintStatus.history.length - 1];
                }

                return HintSrv;
            }];
    });
})(angular);
