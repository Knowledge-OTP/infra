(function (angular) {
    angular.module('demo', [
        'znk.infra.eventManager'
    ])
        .run(function ($rootScope, EventManagerSrv) {
            var runningId = 1;

            var eventManager = new EventManagerSrv();
            $rootScope.eventManager = eventManager;

            $rootScope.registerCb = function () {
                var cbId = runningId++;

                function cb(val, oldVal) {
                    console.log('cb #', cbId, 'was invoked with val:', val, 'old val:', oldVal);
                }
                cb.id = cbId;

                eventManager.registerCb(cb);
            };
        });
})(angular);
