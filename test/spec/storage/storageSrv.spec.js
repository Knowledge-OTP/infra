describe('testing service "StorageSrv":', function () {
    'use strict';

    beforeEach(module('znk.infra.storage', 'htmlTemplates', 'testUtility', 'storage.mock'));

    var $rootScope, StorageSrv, $q, TestUtilitySrv, StorageSrv, $$testAdapter;

    beforeEach(inject([
        '$injector',
        function ($injector) {
            $rootScope = $injector.get('$rootScope');
            StorageSrv = $injector.get('StorageSrv');
            $q = $injector.get('$q');
            TestUtilitySrv = $injector.get('TestUtilitySrv');
            StorageSrv = $injector.get('StorageSrv');
            $$testAdapter = $injector.get('$$testAdapter');
        }
    ]));

    var entityCommunicator,
        communicatorPath = 'test',
        testStorage,
        adapter,
        storageDb,
        syncTestStorage;
    beforeEach(function () {

        adapter = new $$testAdapter();
        storageDb = adapter.__db;
        testStorage = new StorageSrv(adapter);
        syncTestStorage = Object.create(testStorage);
        var fnToConvertToSyncTestStorage = [
            'get',
            'getServerValue',
            'getAndBindToServer',
            'set',
            'update'
        ];
        fnToConvertToSyncTestStorage.forEach(function (fnName) {
            syncTestStorage[fnName] = TestUtilitySrv.general.asyncToSync(testStorage[fnName], testStorage);
        });

        entityCommunicator = syncTestStorage.entityCommunicator(communicatorPath);
        var fnToConvertToSyncEntityCommunicator = [
            'get',
            'set'
        ];
        fnToConvertToSyncEntityCommunicator.forEach(function (fnName) {
            entityCommunicator[fnName] = TestUtilitySrv.general.asyncToSync(entityCommunicator[fnName], entityCommunicator);
        });

    });

    it('when requesting for path value then return object should have its path in prototype object', function () {
        var path = 'pathTo';
        var pathValue = syncTestStorage.get(path);
        expect(pathValue.__proto__.$$path).toEqual(path);
    });

    it('when requesting for entity with uid variable in the path the path should be built correctly',
        function () {
            spyOn(adapter, 'get').and.callThrough();

            var config = {
                variables: {
                    uid: 123456
                }
            };
            syncTestStorage = new StorageSrv(adapter, config);

            var path = 'path/to/' + StorageSrv.variables.uid;
            syncTestStorage.get(path);
            syncTestStorage.set(path, true);
            $rootScope.$digest();
            var expectedPath = 'path/to/123456';
            expect(adapter.get).toHaveBeenCalledWith(expectedPath);
            expect(storageDb.path.to['123456']).toBeTruthy();
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
            syncTestStorage = new StorageSrv(adapter, config);

            var path = 'path/to/' + StorageSrv.variables.appUserSpacePath;
            syncTestStorage.get(path);
            syncTestStorage.set(path, true);
            $rootScope.$digest();
            var expectedPath = 'path/to/users/123456';
            expect(adapter.get).toHaveBeenCalledWith(expectedPath);
            expect(storageDb.path.to.users['123456']).toBeTruthy();
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
        spyOn(adapter, 'update').and.callThrough();

        var entity = entityCommunicator.get();
        entity.newProp = 'new prop';
        entity.$save();
        $rootScope.$digest();

        expect(adapter.update).toHaveBeenCalledWith(communicatorPath, entity);
    });

    it('when updating multiple locations are save simultaneously then cache should be updated accordingly', function () {
        var expectedObj1 = {
            a: 1
        };
        var expectedObj2 = {
            a: 2
        };
        syncTestStorage.update({
            path1: angular.copy(expectedObj1),
            path2: angular.copy(expectedObj2)
        });

        var obj1 = syncTestStorage.get('path1');

        expect(obj1).toEqual(jasmine.objectContaining(expectedObj1));
        expect(obj1.$save).toBeDefined();

        var obj2 = syncTestStorage.get('path2');
        expect(obj2).toEqual(jasmine.objectContaining(expectedObj2));
        expect(obj2.$save).toBeDefined();
    });

    it('when calling cleanPathCache function then next time requesting for the value of this path it should be retrieved ' +
        'from the db', function () {
        var path = 'path';

        storageDb[path] = 'cachedValue';
        syncTestStorage.get(path);


        var expectedValue = 'freshValue';
        storageDb[path] = expectedValue;

        syncTestStorage.cleanPathCache(path);
        expect(syncTestStorage.__cache.get(path)).toBe(undefined);

        var currVal = syncTestStorage.get(path);

        expect(currVal).toBe(expectedValue);
        expect(syncTestStorage.__cache.get(path)).toBe(expectedValue);
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

        syncTestStorage.get(PATH4);
        $rootScope.$digest();
        expectedTimesRetrievedFromServer++;
        //data should be retrieved from cache for this request
        syncTestStorage.get(PATH4);
        $rootScope.$digest();

        expect(adapter.get).toHaveBeenCalledTimes(expectedTimesRetrievedFromServer);
    });

    it('when invoking getServer value function then server value should be always returned', function () {
        var path = 'pathTo';
        var oldValue = 'oldValue';
        var newValue = 'newValue';

        storageDb[path] = oldValue;

        //caching the path
        syncTestStorage.get(path);

        storageDb[path] = newValue;

        expect(syncTestStorage.get(path)).toBe(oldValue);
        expect(syncTestStorage.getServerValue(path)).toBe(newValue);
    });

    it('when invoking getAndBindToServeValue then the path cache should be updated once the server was updated', function () {
        var path = 'pathTo';

        storageDb[path] = {
            prop1: {
                prop1: 1
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

        var currPathValue = syncTestStorage.getAndBindToServer(path);

        var expectedPathValue = {
            prop1: 1,
            prop2: 'b',
            prop4: {
                prop: {
                    prop1: 1,
                    prop2: 2
                }
            }
        };
        adapter.set(path, angular.copy(expectedPathValue));
        $rootScope.$digest();
        expectedPathValue = storageDb[path];
        expect(currPathValue).toEqual(expectedPathValue);
    });

    it('when removing path binding to server then path value should not be updated upon server update', function () {
        spyOn(adapter, 'offEvent');

        var path = 'pathTo';
        syncTestStorage.removeServerPathBinding(path);

        expect(adapter.offEvent).toHaveBeenCalledWith(StorageSrv.EVENTS.VALUE, path);
    })
});
