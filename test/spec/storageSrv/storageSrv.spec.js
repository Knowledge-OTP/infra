describe('testing service "StorageSrv":', function () {
    'use strict';

    beforeEach(module('znk.infra.storage', 'htmlTemplates'));

    var $rootScope, StorageSrv, testStorage;
    beforeEach(inject([
        '$injector',
        function ($injector) {
            $rootScope = $injector.get('$rootScope');
            StorageSrv = $injector.get('StorageSrv');
            var $q = $injector.get('$q');

            var entityMap = {};
            function entityGetter(path){
                return $q.when(entityMap[path]);
            }

            testStorage = new StorageSrv(entityGetter, angular.noop);
        }
    ]));

    var actions = {};

    actions.syncEntityCommunicator = function(entityCommunicator){
        var syncCommunicator = {};
        syncCommunicator.get = function(){
            var res;
            entityCommunicator.get().then(function(_res){
                res = _res;
            });
            $rootScope.$digest();
            return res;
        };

        syncCommunicator.set = function(newEntity){
            var res = entityCommunicator.set(newEntity);
            $rootScope.$digest();
            return res;
        };

        return syncCommunicator;
    };

    it('when getting not exiting data then empty object should be returned', function () {
        var entityCommunicator = actions.syncEntityCommunicator(new testStorage.EntityCommunicator('test'));
        var val = entityCommunicator.get();
        expect(val).toEqual({});
    });

    it('when requesting twice for the same object then same instance should be returned', function () {
        var entityCommunicator = actions.syncEntityCommunicator(new testStorage.EntityCommunicator('test'));
        var expectedValue = entityCommunicator.get();
        var value = entityCommunicator.get();
        expect(value).toBe(expectedValue);
    });
});
