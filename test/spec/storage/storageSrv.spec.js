describe('testing service "StorageSrv":', function () {
    'use strict';

    beforeEach(module('znk.infra.storage', 'htmlTemplates', 'testUtility'));

    var $rootScope, StorageSrv, $q, TestUtilitySrv;

    function entitySetter(pathOrObject, newVal) {
        if (angular.isObject(pathOrObject)) {
            angular.forEach(pathOrObject, function (value, key) {
                entityMap[key] = angular.copy(value);
            });
            return pathOrObject;
        }
        entityMap[pathOrObject] = angular.copy(newVal);
        return $q.when(entityMap[pathOrObject]);
    }

    beforeEach(inject([
        '$injector',
        function ($injector) {
            $rootScope = $injector.get('$rootScope');
            StorageSrv = $injector.get('StorageSrv');
            $q = $injector.get('$q');
            TestUtilitySrv = $injector.get('TestUtilitySrv');
        }
    ]));

    var entityCommunicator,
        communicatorPath = 'test',
        testStorage,
        adapter,
        storageDb;
    beforeEach(function () {
        storageDb = {};

        adapter = {
            get: function(path){
                return $q.when(angular.copy(storageDb[path]));
            },
            set: function(path, newValue){
                storageDb[path] = angular.copy(newValue);
                return this.get(path);
            },
            update: function(pathOrPathToValMap, newValue){
                var pathToValMap = {};
                if(!angular.isObject(pathOrPathToValMap)){
                    pathToValMap[pathOrPathToValMap] = newValue;
                }

                angular.forEach(pathToValMap, function(value, path){
                    storageDb[path] = angular.copy(value);
                });

                return $q.when(angular.isString(pathOrPathToValMap) ? newValue : pathOrPathToValMap);
            },
            onEvent: function(type, path, cb){

            },
            offEvent: function(type, path, cb){

            },
            __triggerEvent: function(){
                var args = Array.prototype.slice.call(arguments);
                var type = args.shift();

                if(!this.__registeredEvents[type]){
                    return;
                }


            },
            __registeredEvents: {}
        };
        testStorage = new StorageSrv(adapter);
        var fnToConvertToSyncTestStorage = [
            'get',
            'getServerValue',
            'getAndBindToServer',
            'set',
            'update'
        ];
        fnToConvertToSyncTestStorage.forEach(function(fnName){
            testStorage[fnName] = TestUtilitySrv.general.asyncToSync(testStorage[fnName], testStorage);
        });

        entityCommunicator = testStorage.entityCommunicator(communicatorPath);
        var fnToConvertToSyncEntityCommunicator  = [
            'get',
            'set'
        ];
        fnToConvertToSyncEntityCommunicator.forEach(function(fnName){
            entityCommunicator[fnName] = TestUtilitySrv.general.asyncToSync(entityCommunicator[fnName], entityCommunicator);
        });

    });

    it('when requesting for entity with uid variable in the path the path should be built correctly',
        function () {
            spyOn(adapter, 'get').and.callThrough();

            var config = {
                variables: {
                    uid: 123456
                }
            };
            testStorage = new StorageSrv(adapter, config);

            var path = 'path/to/' + StorageSrv.variables.uid;
            testStorage.get(path);
            testStorage.set(path, true);
            $rootScope.$digest();
            var expectedPath = 'path/to/123456';
            expect(adapter.get).toHaveBeenCalledWith(expectedPath);
            expect(storageDb[expectedPath]).toBeTruthy();
        }
    );

    it('when requesting for entity with appUserSpacePath variable in the path the path should be built correctly',
        function () {
            spyOn(adapter, 'get').and.callThrough();

            var config = {
                variables: {
                    uid: 123456
                }
            };
            testStorage = new StorageSrv(adapter, config);

            var path = 'path/to/' + StorageSrv.variables.appUserSpacePath;
            testStorage.get(path);
            testStorage.set(path, true);
            $rootScope.$digest();
            var expectedPath = 'path/to/users/123456';
            expect(adapter.get).toHaveBeenCalledWith(expectedPath);
            expect(storageDb[expectedPath]).toBeTruthy();
        }
    );

    it('when getting not exiting data via entity communicator then empty object should be returned', function () {
        var val = entityCommunicator.get();
        delete val.$save;
        expect(val).toEqual({});
    });

    it('when requesting twice for the same object via entity communicator then same instance should be returned', function () {
        var expectedValue = entityCommunicator.get();
        var value = entityCommunicator.get();
        expect(value).toBe(expectedValue);
    });

    it('when saving entity via entity communicator then save entity function should be invoked', function () {
        spyOn(entityCommunicator, 'set').and.callThrough();

        var newValue = {
            prop: 1
        };
        var returnedEntity = entityCommunicator.set(newValue);

        expect(entityCommunicator.set).toHaveBeenCalledWith(newValue);
        expect(returnedEntity).toEqual(newValue);
    });

    it('when invoking $save of received entity then save entity function should be invoked', function () {
        spyOn(adapter, 'set').and.callThrough();

        var entity = entityCommunicator.get();
        entity.newProp = 'new prop';
        entity.$save();
        $rootScope.$digest();

        expect(adapter.set).toHaveBeenCalledWith(communicatorPath, entity);
    });

    it('when updating multiple locations are save simultaneously then cache should be updated accordingly', function () {
        var expectedObj1 = {
            a: 1
        };
        var expectedObj2 = {
            a: 2
        };
        testStorage.update({
            path1: angular.copy(expectedObj1),
            path2: angular.copy(expectedObj2)
        });

        var obj1 = testStorage.get('path1');

        expect(obj1).toEqual(jasmine.objectContaining(expectedObj1));
        expect(obj1.$save).toBeDefined();

        var obj2 = testStorage.get('path2');
        expect(obj2).toEqual(jasmine.objectContaining(expectedObj2));
        expect(obj2.$save).toBeDefined();
    });

    it('when calling cleanPathCache function then next time requesting for the value of this path it should be retrieved ' +
        'from the db', function () {
        var path = 'path';

        storageDb[path] = 'cachedValue';
        testStorage.get(path);


        var expectedValue = 'freshValue';
        storageDb[path] = expectedValue;

        testStorage.cleanPathCache(path);
        expect(testStorage.__cache.get(path)).toBe(undefined);

        var currVal =testStorage.get(path);

        expect(currVal).toBe(expectedValue);
        expect(testStorage.__cache.get(path)).toBe(expectedValue);
    });

    it('when cache rules are defined for storage then paths which were set not be cached should not be cached', function () {
        spyOn(adapter, 'get').and.callThrough();

        var cacheRules = [
            'path1',
            /path2(\/|).*/,
            function (path) {
                return path === 'path3';
            }
        ];
        var config = {
            cacheRules: cacheRules
        };
        var mockStorage = new StorageSrv(adapter, config);

        var expectedTimesRetrievedFromServer = 0;

        var PATH1 = 'path1';
        var PATH2 = 'path2';
        var PATH2_WITH_PREFIX = PATH2 + '/property';
        var PATH3 = 'path3';
        var PATH4 = 'path4';

        function _doubleGetDataOfNotCachedPath(path) {
            expectedTimesRetrievedFromServer += 2;
            mockStorage.get(path);
            $rootScope.$digest();
            mockStorage.get(path);
            $rootScope.$digest();
        }

        _doubleGetDataOfNotCachedPath(PATH1);
        _doubleGetDataOfNotCachedPath(PATH2);
        _doubleGetDataOfNotCachedPath(PATH2_WITH_PREFIX);
        _doubleGetDataOfNotCachedPath(PATH3);

        testStorage.get(PATH4);
        $rootScope.$digest();
        expectedTimesRetrievedFromServer++;
        //data should be retrieved from cache for this request
        testStorage.get(PATH4);
        $rootScope.$digest();

        expect(adapter.get).toHaveBeenCalledTimes(expectedTimesRetrievedFromServer);
    });

    it('when invoking getServer value function then server value should be always returned',function(){
        var path = 'pathTo';
        var oldValue = 'oldValue';
        var newValue = 'newValue';

        storageDb[path] = oldValue;

        //caching the path
        testStorage.get(path);

        storageDb[path] = newValue;

        expect(testStorage.get(path)).toBe(oldValue);
        expect(testStorage.getServerValue(path)).toBe(newValue);
    });

    it('when invoking getAndBindToServeValue then the path cache should be updated once the server was updated', function(){
        var path = 'pathTo',
            expectedPathValue;

        storageDb[path] = {
            prop1: {
                prop1:1
            },
            prop2: 'b',
            prop3: 'c',
            prop4: {
                prop: {
                    prop1: 1,
                    prop2: 2,
                    prop3: 3
                }
            }
        };

        var currPathValue = testStorage.getAndBindToServer(path);

        storageDb[path] = {
            prop1: 1,
            prop2: 'b',
            prop4:{
                prop:{
                    prop1: 1,
                    prop2: 2
                }
            }
        };
        adapter.__triggerEvent('update', path, angular.copy(storageDb[path]));

        expectedPathValue = storageDb[path];
        expect(currPathValue).toBe(expectedPathValue);

        // currPathValue.prop2 = 2;
        // currPathValue.prop4.prop.prop2 = 3;
        // currPathValue.prop5 = 5;
        //
        // storageDb[path] = {
        //     prop1: 2,
        //     prop2: 1,
        //     prop4:{
        //         prop:{
        //             prop1: 1,
        //             prop2: 2
        //         }
        //     }
        // };
    });
});
