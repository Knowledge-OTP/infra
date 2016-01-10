describe('testing service "StorageFirebaseAdapterSrv":', function () {
    'use strict';

    beforeEach(function(){
        window.Firebase = function(path){
            return {
                path: path
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

    var $rootScope, StorageFirebaseAdapterSrv;
    beforeEach(inject([
        '$injector',
        function ($injector) {
            $rootScope = $injector.get('$rootScope');
            StorageFirebaseAdapterSrv = $injector.get('StorageFirebaseAdapterSrv');
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
        var adapter = actions.syncAdapter(new StorageFirebaseAdapterSrv(endpoint));
        var entity = adapter.get('test');
        expect(entity.path).toBe(endpoint + '/test');
    });

    it('when saving entity then $save function should be invoked', function () {
        var endpoint = 'firebase.test';
        var syncedAdapter = actions.syncAdapter(new StorageFirebaseAdapterSrv(endpoint));
        var entity = syncedAdapter.get('test');
        spyOn(entity, '$save');
        syncedAdapter.set('test',entity);
        expect(entity.$save).toHaveBeenCalled();
    });
});
