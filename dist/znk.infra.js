(function (angular) {
    'use strict';

    angular.module('znk.infra', ['znk.infra.pngSequence', 'znk.infra.enum', 'znk.infra.svgIcon', 'znk.infra.content']);
})(angular);
(function (angular) {
    'use strict';

    angular.module('znk.infra.content', []);
})(angular);
(function (angular) {
    'use strict';

    angular.module('znk.infra.enum', []);
})(angular);
(function (angular) {
    'use strict';

    angular.module('znk.infra.pngSequence', []);
})(angular);
(function (angular) {
    'use strict';

    angular.module('znk.infra.svgIcon', []);
})(angular);
'use strict';

(function (angular) {

    angular.module('znk.infra.content').provider('revSrv', revSrv);

    function revSrv() {

        var setContentFuncRef;

        this.setContent = function(func) {
            setContentFuncRef = func;
        };

        this.$get = ['$q', '$injector', function($q, $injector) {

            var contentFunc;

            var contentDataFunc = _getContentData();

            var revSrv = {};

            function _getContentFunc(){
                if (!contentFunc){
                    contentFunc = $injector.invoke(setContentFuncRef);
                }
                return contentFunc;
            }

            function _getContentData() {
                var contentData;
                return function() {
                     return {
                         get: function() {
                             if(!contentData) {
                                 return _getContentFunc().then(function(dataObj) {
                                     contentData = dataObj;
                                     return dataObj;
                                 });
                             }
                             return $q.when(contentData);
                         },
                         set: function(practiceName, newData) {
                             contentData.revisionManifest[practiceName] = newData;
                             return $q.when({ rev: newData.rev, status: 'update'});
                         }
                     }
                }
            }

            revSrv.getRev = function(practiceName) {
                return contentDataFunc().get().then(function(dataObj) {

                    if(!dataObj || !dataObj.revisionManifest || !dataObj.latestRevisions) {
                        return { error: 'No Data Found! ', data: dataObj };
                    }

                    var userManifest = dataObj.revisionManifest[practiceName];
                    var publicationManifest = dataObj.latestRevisions[practiceName];
                    var newRev;

                    if(angular.isUndefined(publicationManifest)) {
                        return { error: 'Not Found', data: dataObj };
                    }

                    if(!userManifest) {
                        newRev = { rev:  publicationManifest.rev, status: 'new' };
                    } else if(userManifest.rev < publicationManifest.rev) {
                        newRev = { rev:  userManifest.rev, status: 'old' };
                    } else if(userManifest.rev === publicationManifest.rev) {
                        newRev = { rev:  publicationManifest.rev, status: 'same' };
                    } else {
                        newRev = { error: 'failed to get revision!', data: dataObj };
                    }


                    return newRev;

                });
            };

            revSrv.setRev = function(practiceName, newRev) {
                return contentDataFunc().set(practiceName, { rev: newRev });
            };

            return revSrv;
        }];


    }

})(angular);

(function (angular) {
    'use strict';

    var exerciseStatusEnum = {
        NEW: 0,
        ACTIVE: 1,
        COMPLETED: 2,
        COMING_SOON: 3
    };

    angular.module('znk.infra.enum').constant('exerciseStatusConst', exerciseStatusEnum);

    angular.module('znk.infra.enum').factory('ExerciseStatusEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['NEW', exerciseStatusEnum.NEW, 'new'],
                ['ACTIVE', exerciseStatusEnum.ACTIVE, 'active'],
                ['COMPLETED', exerciseStatusEnum.COMPLETED, 'completed'],
                ['COMING_SOON', exerciseStatusEnum.COMING_SOON, 'coming soon']
            ]);
        }
    ]);
})(angular);
'use strict';
(function (angular) {
    angular.module('znk.infra.enum').factory('EnumSrv', [
        function () {
            var EnumSrv = {};

            function BaseEnum(enumsArr) {
                var NAME_INDEX = 0;
                var ENUM_INDEX = 1;
                var VALUE_INDEX = 2;
                var self = this;
                enumsArr.forEach(function (item) {
                    self[item[NAME_INDEX]] = {
                        enum: item[ENUM_INDEX],
                        val: item[VALUE_INDEX]
                    };
                });
            }

            EnumSrv.BaseEnum = BaseEnum;

            BaseEnum.prototype.getEnumMap = function getEnumMap() {
                var enumsObj = this;
                var enumMap = {};
                var enumsPropKeys = Object.keys(enumsObj);
                for (var i in enumsPropKeys) {
                    var prop = enumsPropKeys[i];
                    var enumObj = enumsObj[prop];
                    enumMap[enumObj.enum] = enumObj.val;
                }
                return enumMap;
            };

            BaseEnum.prototype.getEnumArr = function getEnumArr() {
                var enumsObj = this;
                var enumArr = [];
                for (var prop in enumsObj) {
                    var enumObj = enumsObj[prop];
                    if (angular.isObject(enumObj)) {
                        enumArr.push(enumObj);
                    }
                }
                return enumArr;
            };

            EnumSrv.flashcardStatus = new BaseEnum([
                ['keep', 0, 'Keep'],
                ['remove', 1, 'Remove']
            ]);

            return EnumSrv;
        }
    ]);
})(angular);

/**
 * Created by Igor on 8/19/2015.
 */
/**
 * attrs:
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.pngSequence').directive('pngSequence', [
        '$timeout', 'ExpansionSrcSrv', '$window',
        function ($timeout, ExpansionSrcSrv, $window) {
            return {
                restrict: 'E',
                scope:{
                    onEnded: '&',
                    loop: '&',
                    speed:'&',
                    autoPlay: '&',
                    actions: '='
                },
                link: function (scope, element, attrs) {

                    var indexBound;

                    var requestID;

                    function buildComponent(){
                        var startIndex = +attrs.startIndex;
                        var endIndex = +attrs.endIndex;
                        var imageNum;
                        indexBound = endIndex - startIndex;
                        for(var i = startIndex; i < endIndex ; i++){
                            if(i < 100 || i < 10){
                                imageNum = i < 10 ? '00' + i :'0' + i;
                            }else{
                                imageNum = i;
                            }

                            var htmlTemplate = '<div ' +
                                ' style="background-image: url(\'' + ExpansionSrcSrv.getExpansionSrc(attrs.imgData + imageNum + '.png') + '\'); background-size: cover; will-change: opacity; opacity:0; position: absolute; top:0; left:0;"></div>';

                            element.append(htmlTemplate);
                        }
                    }

                    function destroyCurrent(){
                        element.empty();
                    }

                    function PngAnimation() {
                        this.index = 0;
                        this.imagesDomElem = element[0].children;
                        this.lastTimestamp = false;
                    }


                    function animatePlay(timestamp) {

                        if(this.index === indexBound-1 && !scope.loop()){
                            $timeout(function(){
                                var children = element.children();
                                angular.element(children[children.length - 1]).css('display', 'none');
                                scope.onEnded();
                            });
                        }else{
                            if(this.lastTimestamp && (timestamp - this.lastTimestamp) < 40) {
                                requestID = $window.requestAnimationFrame(animatePlay.bind(this));
                            } else {
                                this.imagesDomElem[this.index].style.opacity   =  0;
                                this.index = (this.index+1) % indexBound;
                                this.imagesDomElem[this.index].style.opacity   =  1;
                                this.lastTimestamp = timestamp;
                                requestID = $window.requestAnimationFrame(animatePlay.bind(this));
                            }
                        }

                    }

                    function observeHandler(){
                        destroyCurrent();
                        if(attrs.imgData && angular.isDefined(attrs.startIndex)&& attrs.endIndex){
                            buildComponent();
                            if(scope.autoPlay()){
                                var animateInstance = new PngAnimation();
                                requestID = $window.requestAnimationFrame(animatePlay.bind(animateInstance));
                            }
                        }
                    }

                    function watchFn(){
                        return attrs.imgData + '_' + attrs.startIndex + '_' + attrs.endIndex + '_' + attrs.rotate;
                    }
                    scope.$watch(watchFn,observeHandler);

                    scope.actions = scope.actions || {};
                    scope.actions.play = function(){
                        //added in order for the build function to be executed before the play
                        $timeout(function(){
                            var animateInstance = new PngAnimation();
                            requestID = $window.requestAnimationFrame(animatePlay.bind(animateInstance));
                        },0,false);
                    };
                    scope.actions.reset = destroyCurrent;

                    scope.$on('$destroy',function(){
                        $window.cancelAnimationFrame(requestID);
                    });
                }
            };
        }
    ]);
})(angular);
/**
 * attrs:
 *  name: svg icon name
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.svgIcon').directive('svgIcon', [
        '$log', 'SvgIconSrv',
        function ($log, SvgIconSrv) {
            return {
                scope: {
                    name: '@'

                },
                link: {
                    pre: function (scope, element, attrs) {
                        element.css('display','block');

                        var name = scope.name;
                        if (!name) {
                            $log.error('svgIcon directive: name attribute was not set');
                            return;
                        }

                        SvgIconSrv.getSvgByName(name).then(function (svg) {
                            element.append(svg);
                        });
                    }
                }
            };
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.svgIcon').provider('SvgIconSrv', [

        function () {
            var defaultConfig = {};
            this.setConfig = function (_config) {
                angular.extend(defaultConfig, _config);
            };

            var svgMap;
            this.registerSvgSources = function (_svgMap) {
                svgMap = _svgMap;
            };

            var getSvgPromMap = {};

            this.$get = [
                '$templateCache', '$q', '$http',
                function ($templateCache, $q, $http) {
                    var SvgIconSrv = {};

                    SvgIconSrv.getSvgByName = function (name) {
                        var src = svgMap[name];

                        if(getSvgPromMap[src]){
                            return getSvgPromMap[src];
                        }

                        var fromCache = $templateCache.get(src);
                        if(fromCache){
                            return $q.when(fromCache);
                        }

                        var getSvgProm =  $http.get(src).then(function(res){
                            $templateCache.put(src,res.data);
                            delete getSvgPromMap[src];
                            return res.data;
                        });
                        getSvgPromMap[src] = getSvgProm;

                        return getSvgProm;
                    };

                    return SvgIconSrv;
                }
            ];
        }]);
})(angular);
