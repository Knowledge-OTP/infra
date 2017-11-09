(function (angular) {
    'use strict';

    angular.module('znk.infra.hint', ['znk.infra.config']);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.hint').provider('HintSrv', function () {
        var registeredHints = {};

        var _hintMap = {};

        this.registerHint = function (hintName, hintAction, determineWhetherToTriggerFnGetter) {
            if (!registeredHints[hintName]) {
                registeredHints[hintName] = {
                    name: hintName,
                    action: hintAction,
                    determineWhetherToTriggerGetter: determineWhetherToTriggerFnGetter
                };
            }
            _hintMap[hintName] = hintName;
        };

        this.$get = ["InfraConfigSrv", "$q", "$log", "$injector", "StorageSrv", function (InfraConfigSrv, $q, $log, $injector, StorageSrv) {
            'ngInject';

            var HintSrv = {};
            var hintPath = StorageSrv.variables.appUserSpacePath + '/hint';
            var defaultHints = {
                hintsStatus: {}
            };

            HintSrv.hintMap = _hintMap;

            HintSrv.triggerHint = function (hintName) {
                var hintData = registeredHints[hintName];
                if (!hintData) {
                    $log.error('HintSrv: the following hint is not registered ' + hintName);
                }
                return getHints().then(function (hints) {
                    var hintsStatus = hints.hintsStatus;
                    var hintLastVal = getHintLastValue(hintsStatus[hintName]);

                    var determineWhetherToTrigger;
                    if (hintData.determineWhetherToTriggerGetter) {
                        determineWhetherToTrigger = $injector.invoke(hintData.determineWhetherToTriggerGetter);
                    } else {
                        determineWhetherToTrigger = defaultDetermineWhetherToTriggerFn;
                    }

                    return $q.when(determineWhetherToTrigger(hintLastVal)).then(function (shouldBeTriggered) {
                        if (shouldBeTriggered) {
                            var hintAction = $injector.invoke(hintData.action);

                            return $q.when(hintAction(hintLastVal)).then(function (result) {
                                if (!hintsStatus[hintName]) {
                                    hintsStatus[hintName] = {
                                        name: hintName,
                                        history: []
                                    };
                                }

                                // TODO - FIX (ASSAF)
                                // hintsStatus[hintName].history.push({
                                //     value: angular.isUndefined(result) ? true : result,
                                //     date: StorageSrv.variables.currTimeStamp
                                // });

                                hints.hintsStatus = hintsStatus;
                                saveHints(hints);
                                return result;
                            });
                        }
                    });
                });
            };

                function getHints(){
                    return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                        return StudentStorageSrv.get(hintPath, defaultHints).then(function (hint) {
                            return hint;
                        });
                    });
                }

                function saveHints(newHint){
                    return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                        return StudentStorageSrv.set(hintPath, newHint);
                    });
                }

            function getHintLastValue(hintStatus) {
                return hintStatus && hintStatus.history && hintStatus.history.length && hintStatus.history[hintStatus.history.length - 1];
            }

            function defaultDetermineWhetherToTriggerFn(hintVal) {
                return angular.isUndefined(hintVal) || !hintVal.value;
            }

            return HintSrv;
        }];
    });
})(angular);

angular.module('znk.infra.hint').run(['$templateCache', function($templateCache) {

}]);
