(function (angular) {
    'use strict';

    angular.module('znk.infra.eventManager', []);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.eventManager').service('EventManagerSrv',
        ["$log", function ($log) {
            'ngInject';

            function EventManagerSrv() {
                this.cbArr = [];
                this.currVal = null;
            }

            EventManagerSrv.prototype.registerCb = function (cb) {
                if(this.cbArr.indexOf(cb) !== -1){
                    $log.error('cb already registered');
                    return;
                }
                this.cbArr.push(cb);
                this.invokeCb(cb, this.currVal);
            };

            EventManagerSrv.prototype.unregisterCb = function (cb) {
                if (!cb) {
                    this.cbArr = [];
                    return;
                }

                var cbIndex = this.cbArr.indexOf(cb);
                if(cbIndex !== -1){
                    this.cbArr.splice(cbIndex, 1);
                }
            };

            EventManagerSrv.prototype.invokeCb = function (cb, oldVal) {
                cb(this.currVal, oldVal);
            };

            EventManagerSrv.prototype.invokeAllCbs = function (oldVal) {
                var self = this;
                this.cbArr.forEach(function (cb) {
                    self.invokeCb(cb, oldVal);
                });
            };

            EventManagerSrv.prototype.updateValue = function (newVal) {
                var oldVal = this.currVal;
                this.currVal = newVal;
                this.invokeAllCbs(oldVal);
            };

            return EventManagerSrv;
        }]
    );
})(angular);

angular.module('znk.infra.eventManager').run(['$templateCache', function ($templateCache) {

}]);
