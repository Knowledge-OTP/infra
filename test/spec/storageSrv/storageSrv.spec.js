describe('testing service "StorageSrv":', function () {
    'use strict';

    beforeEach(module('znk.infra.storage', 'htmlTemplates'));

    var $rootScope, StorageSrv, testStorage, $q;
    var entityMap = {};

    function entityGetter(path){
        return $q.when(entityMap[path]);
    }

    function entitySetter(pathOrObject, newVal){
        if(angular.isObject(pathOrObject)){
            angular.forEach(pathOrObject, function(value,key){
                entityMap[key] = value;
            });
            return pathOrObject;
        }
        entityMap[pathOrObject] = newVal;
        return $q.when(entityMap[pathOrObject]);
    }

    beforeEach(inject([
        '$injector',
        function ($injector) {
            $rootScope = $injector.get('$rootScope');
            StorageSrv = $injector.get('StorageSrv');
            $q = $injector.get('$q');

            testStorage = new StorageSrv(entityGetter, angular.noop);
        }
    ]));

    var actions = {};

    actions.syncEntityCommunicator = function(){
        var entityCommunicator = testStorage.entityCommunicator('test');
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

    it('when getting not exiting data via entity communicator then empty object should be returned', function () {
        var entityCommunicator = actions.syncEntityCommunicator();
        var val = entityCommunicator.get();
        delete val.$save;
        expect(val).toEqual({});
    });

    it('when requesting twice for the same object via entity communicator then same instance should be returned', function () {
        var entityCommunicator = actions.syncEntityCommunicator();
        var expectedValue = entityCommunicator.get();
        var value = entityCommunicator.get();
        expect(value).toBe(expectedValue);
    });

    it('when saving entity via entity communicator then save entity function should be invoked', function () {
        var savedEntity;
        function saveEntity(path, _entity){
            savedEntity = _entity;
        }
        testStorage = new StorageSrv(entityGetter, saveEntity);

        var entityCommunicator = actions.syncEntityCommunicator();
        var entity = entityCommunicator.get();
        entity.newProp = 'new prop';
        entityCommunicator.set(entity);

        expect(savedEntity).toEqual(entity);
    });

    it('when invoking $save of received entity then save entity function should be invoked',function(){
        var savedEntity;
        function saveEntity(path, _entity){
            savedEntity = _entity;
        }
        testStorage = new StorageSrv(entityGetter, saveEntity);

        var entityCommunicator = actions.syncEntityCommunicator();
        var entity = entityCommunicator.get();
        entity.newProp = 'new prop';
        entity.$save();

        expect(savedEntity).toEqual(entity);
    });

    it('when set multiple locations are save simultaneously then cache should be updated accordingly',function(){
        testStorage = new StorageSrv(entityGetter, entitySetter);

        var expectedObj1 = {
            a:1
        };
        var expectedObj2 = {
            a:2
        };

        testStorage.set({
            path1: expectedObj1,
            path2: expectedObj2
        });

        var obj1;
        testStorage.get('path1').then(function(res){
            obj1 = res;
        });
        $rootScope.$digest();
        expect(obj1).toEqual(jasmine.objectContaining(expectedObj1));
        expect(obj1.$save).toBeDefined();

        var obj2;
        testStorage.get('path2').then(function(res){
            obj2 = res;
        });
        $rootScope.$digest();
        expect(obj2).toEqual(jasmine.objectContaining(expectedObj2));
        expect(obj2.$save).toBeDefined();
    });
});
