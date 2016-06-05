(function (angular) {
    'use strict';

    angular.module('znk.infra.content', []);
})(angular);
'use strict';

(function (angular) {

    function ContentSrv() {

        var setContentFuncRef;

        this.setContent = function(func) {
            setContentFuncRef = func;
        };

        this.$get = ['$q', '$log', '$injector', function($q, $log, $injector) {

            function _getContentData() {
                var contentData;
                return function() {
                    return {
                        get: function() {
                            if(!contentData) {
                                return _getContentFunc().then(function(dataObj) {
                                    contentData = dataObj;
                                    if (angular.isFunction(contentData.updatePublication)) {
                                        contentData.updatePublication(function(updatePublication) {
                                            if(updatePublication.key() !== contentData.key) {
                                                contentData.latestRevisions = updatePublication.val();
                                                contentData.key = updatePublication.key();
                                            }
                                        });
                                    }
                                    return dataObj;
                                });
                            }
                            return $q.when(contentData);
                        },
                        set: function(practiceName, newData) {
                            contentData.revisionManifest[practiceName] = newData;
                            return $q.when({ rev: newData.rev, status: 'update'});
                        }
                    };
                };
            }

            var contentFunc;

            var contentDataFunc = _getContentData();

            var ContentSrv = {};

            function _getContentFunc(){
                if (!contentFunc){
                    contentFunc = $injector.invoke(setContentFuncRef);
                }
                return contentFunc;
            }

            function _getLatestRevision(contentBasePath, rev, dataObj) {
                var content = dataObj.create(contentBasePath+rev);
                var revContentProm = $q.when(content.get());
                return revContentProm.then(function(contentData) {
                    if (!contentData || angular.equals({}, contentData)) {
                        $log.error('ContentSrv: _getLatestRevision: no revision content found! rev: ' + rev + ' contentBasePath: ' + contentBasePath);
                        return _getLatestRevision(contentBasePath, rev - 1, dataObj);
                    }
                    return contentData;
                });
            }

            ContentSrv.getRev = function(practiceName, dataObj) {
                var getRevisionProm = $q.when(false);

                if (angular.isFunction(dataObj.revisionManifestGetter)) {
                    getRevisionProm = dataObj.revisionManifestGetter().then(function (result) {
                        dataObj.revisionManifest = result;
                        return result;
                    });
                }

                return getRevisionProm.then(function () {
                    if (!dataObj || !dataObj.revisionManifest || !dataObj.latestRevisions) {
                        return $q.when({error: 'No Data Found! ', data: dataObj});
                    }

                    var userManifest = dataObj.revisionManifest[practiceName];
                    var publicationManifest = dataObj.latestRevisions[practiceName];
                    var newRev;

                    if (angular.isUndefined(publicationManifest)) {
                        return $q.when({error: 'Not Found', data: dataObj});
                    }

                    if (!userManifest) {
                        newRev = {rev: publicationManifest.rev, status: 'new'};
                    } else if (userManifest.rev < publicationManifest.rev) {
                        newRev = {rev: userManifest.rev, status: 'old'};
                    } else if (userManifest.rev === publicationManifest.rev) {
                        newRev = {rev: publicationManifest.rev, status: 'same'};
                    } else {
                        newRev = {rev: userManifest.rev, status: 'weird'};
                    }

                    return newRev;
                });
            };

            ContentSrv.setRev = function(practiceName, newRev) {
                return contentDataFunc().set(practiceName, { rev: newRev });
            };

            // { exerciseId: 10, exerciseType: 'drill' }
            ContentSrv.getContent = function(pathObj) {

                if(!pathObj || !pathObj.exerciseType) {
                    return $q.reject({ error: 'Error: getContent require exerciseType!' });
                }

                var path = (pathObj.exerciseId) ? pathObj.exerciseType+pathObj.exerciseId : pathObj.exerciseType;

                return contentDataFunc().get().then(function(dataObj) {

                    return ContentSrv.getRev(path, dataObj).then(function(result) {

                        if(result.error) {
                            return $q.when(result);
                        }

                        if(!dataObj.contentRoot) {
                            return $q.when({ error: 'Error: getContent require contentRoot to be defined in config phase!' });
                        }

                        if(!dataObj.userRoot) {
                            return $q.when({ error: 'Error: getContent require userRoot to be defined in config phase!' });
                        }

                        if(result.status === 'weird') {
                            $log.error('ContentSrv: getContent: user revision is weird! rev: ' + result.rev);
                        }

                        if(result.status === 'new') {
                            ContentSrv.setRev(path, result.rev).then(function() {
                                var userPath = dataObj.userRoot+'/revisionManifest/'+path;
                                var setUserRevision = dataObj.create(userPath);
                                setUserRevision.set({ rev : result.rev });
                            });
                        }

                        var contentBasePath = dataObj.contentRoot+path+'-rev-';

                        return _getLatestRevision(contentBasePath, result.rev, dataObj);
                    });
                });
            };

            ContentSrv.getAllContentIdsByKey = function(key) {
                var arrayOfKeys = [];
                return contentDataFunc().get().then(function(dataObj) {
                    for(var objKey in dataObj.latestRevisions) {
                        if(dataObj.latestRevisions.hasOwnProperty(objKey) && objKey.indexOf(key) !== -1) {
                            arrayOfKeys.push(objKey);
                        }
                    }
                    return arrayOfKeys;
                });
            };

            return ContentSrv;
        }];
    }

    angular.module('znk.infra.content').provider('ContentSrv', ContentSrv);

})(angular);

angular.module('znk.infra.content').run(['$templateCache', function($templateCache) {

}]);
