describe('testing service "storageFirebaseAdapter":', function () {
    'use strict';

    beforeEach(function(){
        var map = {};
        window.Firebase = function(path){
            return {
                path: path,
                once: function(type,successCB,failureCB){
                    var snapshot = {
                        val: function(){
                            return map[path] || null;
                        }
                    };
                    successCB(snapshot);
                },
                set: function(value){
                    map[path] = value;
                }
            };
        };
    });

    beforeEach(module('znk.infra.storage', 'htmlTemplates'));

    beforeEach(module(function($provide) {
        $provide.factory('$firebaseObject',function($q){
            function $firebaseObject(fbObj){
                return {
                    $loaded: function(){
                        return $q.when({
                            path: fbObj.path,
                            $save: angular.noop
                        });
                    }
                };
            }
            return $firebaseObject;
        });

        $provide.factory('$firebaseAuth',function($q){
            function $firebaseAuth(path){
                return {
                    $getAuth: function(){
                        return {
                            uid: 1
                        };
                    }
                };
            }
            return $firebaseAuth;
        });
    }));

    var $rootScope, storageFirebaseAdapter;
    beforeEach(inject([
        '$injector',
        function ($injector) {
            $rootScope = $injector.get('$rootScope');
            storageFirebaseAdapter = $injector.get('storageFirebaseAdapter');
        }])
    );


    var actions = {};

    actions.syncAdapter = function(adapter){
        return {
            get: function(path){
                var val;
                adapter.get(path).then(function(_val){
                    val = _val;
                });
                $rootScope.$digest();
                return val;
            },
            set: function(path,newEntity){
                var val;
                adapter.set(path, newEntity);
                $rootScope.$digest();
                return val;
            }
        };
    };

    it('when requesting for entity then the firebase path should be built correctly', function () {
        var endpoint = 'firebase.test';
        var adapter = actions.syncAdapter(storageFirebaseAdapter(endpoint));
        spyOn(window,'Firebase').and.callThrough();
        adapter.get('test');
        expect(window.Firebase).toHaveBeenCalledWith('firebase.test/test');
    });

    it('when saving entity then $save function should be invoked', function () {
        var endpoint = 'firebase.test';
        var syncedAdapter = actions.syncAdapter(storageFirebaseAdapter(endpoint));
        var entity = syncedAdapter.get('test');
        spyOn(entity, '$save');
        syncedAdapter.set('test',entity);
        expect(entity.$save).toHaveBeenCalled();
    });

    it('when saving entity then all undefined and start with $ properties should be deleted', function () {
        var endpoint = 'firebase.test';
        var syncedAdapter = actions.syncAdapter(storageFirebaseAdapter(endpoint));
        var entity = syncedAdapter.get('test');
        var expectedResult = angular.copy(entity);
        entity.prop1 = undefined;
        entity.$prop = 'test';
        syncedAdapter.set('test',entity);
        expect(entity).toEqual(expectedResult);
    });
});
