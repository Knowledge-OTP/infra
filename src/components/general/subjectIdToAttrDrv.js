/**
 *  @directive subjectIdToAttrDrv
 *  This directive is an evolution of 'subjectIdToClassDrv'
 *  @context-attr a comma separated string of attribute names
 *  @znk-prefix a comma separated string of prefixes to the attribute values
 *  @znk-suffix a comma separated string of suffixes to the attribute values
 *
 *  In case only one prefix/suffix is provided, it will be used in all attributes
 *  In case no @context-attr is provided, it will set the class attribute by default
 *  No need to pass dashes ('-') to prefix or suffix, they are already appended
 */
(function (angular) {
    'use strict';

    angular.module('znk.infra.general').directive('subjectIdToAttrDrv', [
        'SubjectEnum', '$interpolate',
        function (SubjectEnum, $interpolate) {
            return {
                link: {
                    pre: function (scope, element, attrs) {
                        var watchDestroyer = scope.$watch(attrs.subjectIdToAttrDrv,function(subjectId){
                            var contextAttr = attrs.contextAttr ? $interpolate(attrs.contextAttr)(scope) : undefined;
                            var prefix = attrs.prefix ? $interpolate(attrs.prefix )(scope) : undefined;
                            var suffix = attrs.suffix ? $interpolate(attrs.suffix )(scope) : undefined;

                            if(angular.isUndefined(subjectId)){
                                return;
                            }
                            watchDestroyer();

                            var attrsArray;
                            if (contextAttr) {
                                attrsArray = contextAttr.split(',');
                            } else {
                                attrsArray = [];
                                attrsArray.push('class');
                            }

                            var attrPrefixes = (prefix) ? prefix.split(',') : [];
                            var attrSuffixes = (suffix) ? suffix.split(',') : [];

                            var subjectEnumMap = SubjectEnum.getEnumMap();
                            var subjectNameToAdd = subjectEnumMap[subjectId];

                            angular.forEach(attrsArray, function(value, key){
                                var attrVal = subjectNameToAdd;

                                if(attrPrefixes.length){
                                    attrVal = (attrPrefixes[key] || attrPrefixes[0])  + '-' + attrVal;
                                }

                                if(attrSuffixes.length){
                                    attrVal += '-' + (attrSuffixes[key] || attrSuffixes[0]);
                                }

                                attrVal = attrVal.replace(/\s+/g,'');   // regex to clear spaces

                                element.attr(value, attrVal);
                            });

                        });
                    }
                }
            };
        }
    ]);
})(angular);
