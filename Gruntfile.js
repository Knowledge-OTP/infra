// Generated on 2015-08-18 using generator-angular 0.12.1
'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    // Automatically load required Grunt tasks
    require('jit-grunt')(grunt, {
        useminPrepare: 'grunt-usemin',
        ngtemplates: 'grunt-angular-templates',
        cdnify: 'grunt-google-cdn'
    });

    // Configurable paths for the application
    var appConfig = {
        src: 'src',
        dist: 'dist',
        tmp: '.tmp',
        appName: 'znk.infra'
    };

    // Define the configuration for all the tasks
    grunt.initConfig({

        // Project settings
        yeoman: appConfig,
        // Make sure code styles are up to par and there are no obvious mistakes
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: {
                src: [
                    'Gruntfile.js',
                    '<%= yeoman.src %>/**/*.js'
                ]
            },
            test: {
                options: {
                    jshintrc: 'test/.jshintrc'
                },
                src: ['test/spec/{,*/}*.js']
            }
        },

        // Empties folders to start fresh
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '<%= yeoman.tmp %>',
                        '<%= yeoman.dist %>/{,*/}*',
                        '!<%= yeoman.dist %>/.git{,*/}*'
                    ]
                }]
            },
            html2JsTemplates: {
                files: [{
                    src: [
                        '<%= yeoman.tmp %>/*/templates.js'
                    ]
                }]
            },
            server: '.tmp'
        },

        // Automatically inject Bower components into the app
        wiredep: {
            demo: {
                options: {
                    fileTypes: {
                        html: {
                            replace: {
                                js: function (dest) {
                                    // debugger;
                                    var path = dest.replace('../../bower_components/', '');
                                    return '<script src="' + path + '"></script>';
                                },
                                css: function (dest) {
                                    // debugger;
                                    var path = dest.replace('../../bower_components/', '');
                                    return '<link rel="stylesheet" href="' + path + '" />';
                                }
                            }
                        }
                    }
                },
                src: 'demo/**/index.html',
                exclude: [
                    'jquery'
                ]
            },
            test: {
                devDependencies: true,
                src: '<%= karma.unit.configFile %>',
                ignorePath: /\.\.\//,
                fileTypes: {
                    js: {
                        block: /(([\s\t]*)\/{2}\s*?bower:\s*?(\S*))(\n|\r|.)*?(\/{2}\s*endbower)/gi,
                        detect: {
                            js: /'(.*\.js)'/gi
                        },
                        replace: {
                            js: '\'{{filePath}}\','
                        }
                    }
                }
            }
        },
        concat: {
            mainModule: {
                //js files configuration is generated in prepareConfiguration
                files: [{
                    src: ['<%= yeoman.tmp %>/*/main.css'],
                    dest: '<%= yeoman.tmp %>/main.css'
                },{
                    src: ['<%= yeoman.src %>/core/module.js', '<%= yeoman.tmp %>/*/*.js'],
                    dest: '<%= yeoman.tmp %>/main.js'
                }]
            }
        },
        uglify: {
            dist: {
                files: {
                    '<%= yeoman.dist %>/<%= yeoman.appName %>.min.js': '<%= yeoman.dist %>/<%= yeoman.appName %>.js'
                }
            }
        },
        // ng-annotate tries to make the code safe for minification automatically
        // by using the Angular long form for dependency injection.
        ngAnnotate: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.dist %>',
                    src: '**/*.js',
                    dest: '<%= yeoman.dist %>'
                }]
            }
        },
        // Test settings
        karma: {
            unit: {
                browsers: [
                    'Chrome',
                    'Safari'
                ],
                configFile: 'test/karma-unit.conf.js'
            },
            ci: {
                configFile: 'test/karma-unit.conf.js',
                singleRun: true,
                browsers: ['PhantomJS']
            },
            build: {
                configFile: 'test/karma-unit.conf.js',
                singleRun: true,
                browsers: [
                    'Chrome'
                ]
            }
        },
        connect: {
            options: {
                base: ['.tmp', 'bower_components', 'demoShared', 'tmpLocalization'],
                open: true,
                livereload: 35730
            },
            serve: {
                options: {
                    port: 9001,
                    hostname: 'localhost'
                }
            }
        },
        watch: {
            options: {
                livereload: '<%= connect.options.livereload %>',
                host: 'localhost'
            },
            js: {
                files: [
                    'src/**/*.js'
                ],
                tasks: ['build']
            },
            html: {
                files: [
                    'src/**/*.{html,svg}'
                ],
                tasks: ['build']
            },
            demo: {
                files: [
                    'demo/**/*.*'
                ]
            },
            sass: {
                files: [
                    'src/**/*.scss'
                ],
                tasks: ['sass', 'autoprefixer:main', 'concat:mainModule']
            },
            assets: {
                files: ['<%= yeoman.src %>/**/locale/*.json', '<%= yeoman.src %>/**/*.{png}'],
                tasks: ['build']
            },
            wiredep: {
                files: ['bower.json'],
                tasks: ['wiredep']
            }
        },
        sass: {
            // options: {
            //     sourceMap: true
            // },
            allComponenets: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.src %>/components',
                    src: '*/main.scss',
                    dest: '<%= yeoman.tmp %>/',
                    ext: '.css'
                }]
            }
        },
        copy: {
            build: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.src %>/components',
                    src: '*/locale/*.*',
                    dest: '<%= yeoman.tmp %>'
                }, {
                    expand: true,
                    cwd: '<%= yeoman.src %>/components',
                    src: '*/assets/**/*.*',
                    dest: '<%= yeoman.tmp %>'
                }, {
                    src: '<%= yeoman.src %>/components/mixins/_mixins.scss',
                    dest: '<%= yeoman.tmp %>/mixins/_mixins.scss'
                }, {
                    expand: true,
                    cwd: '<%= yeoman.src %>/components/',
                    src: '*/assets/**/*.*',
                    dest: '<%= yeoman.tmp %>/assets',
                    rename: function (dest, src) {
                        var indexOfAssets = src.indexOf('assets');
                        var destSuffix = src.substr(indexOfAssets + 7);
                        return '.tmp/assets/' + destSuffix;
                    }
                }]
            },
            serve:{
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.src %>/components',
                    src: ['*/locale/*.json'],
                    dest: 'tmpLocalization/'
                }]
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.tmp %>/',
                    src: ['**/*.*'],
                    dest: '<%= yeoman.dist %>/'
                }]
            }
        },
        html2js: {
            options: {
                module: appConfig.appName,
                singleModule: true,
                existingModule: true
            }
        },
        autoprefixer: {
            options: {
                browsers: ['last 2 versions']
            },
            main: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.tmp %>/',
                    src: ['**/*.css'],
                    dest: '<%= yeoman.tmp %>/'
                }]
            }
        },
        replace: {
            allModulesInMainJs: {
                options: {
                    patterns: [
                        {
                            match: /\/\*\* allModules \*\*\//g,
                            replacement: ''// will be set in prepareConfiguration task
                        }
                    ]
                },
                files: [
                    {
                        src: '<%= yeoman.tmp %>/main.js',
                        dest: '<%= yeoman.tmp %>/main.js'
                    }
                ]
            }
        }
    });

    grunt.registerTask('test', [
        'wiredep',
        'karma:unit'
    ]);

    grunt.registerTask('default', [
        'build'
    ]);

    grunt.registerTask('ci', function () {
        grunt.task.run([
            'jshint:all',
            'karma:ci'
        ]);
    });

    grunt.registerTask('serve', function (component) {
        if (component) {
            var additionalBase = 'demo/' + component;
            console.log('serving also from', additionalBase);
            var connectConfig = grunt.config('connect');
            connectConfig.options.base.push(additionalBase);
            grunt.config('connect', connectConfig);
        }
        console.log('serving from', grunt.config('connect').options.base);
        grunt.task.run([
            'build',
            'copy:serve',
            'wiredep',
            'connect:serve',
            'watch'
        ]);
    });

    grunt.registerTask('prepareConfiguration', 'preparing html2js and concat configuration for each component', function () {
        var concat = grunt.config.get('concat') || {};

        concat.build = {
            files: []
        };

        var html2js = grunt.config.get('html2js') || {};

        var allModulesReplaceStr = '';

        grunt.file.expand("src/components/*").forEach(function (dir) {
            // get the module name from the directory name
            var dirName = dir.substr(dir.lastIndexOf('/') + 1);
            //mixins component has no js
            if (dirName === 'mixins') {
                return;
            }

            html2js[dirName] = {
                options: {
                    module: appConfig.appName + '.' + dirName,
                    base: 'src'
                },
                src: [dir + '/**/*.{html,svg}'],
                dest: '<%= yeoman.tmp %>/' + dirName + '/templates.js'
            };

            // create a subtask for each module, find all src files
            // and combine into a single js file per component, should be running after html2js task
            concat.build.files.push({
                src: [dir + '/module.js', dir + '/**/*.js', '<%= yeoman.tmp %>/' + dirName + '/templates.js'],
                dest: '<%= yeoman.tmp %>/' + dirName + '/' + dirName + '.js'
            });

            if(allModulesReplaceStr !== ''){
                allModulesReplaceStr += ',\n';
            }
            allModulesReplaceStr += '"' + appConfig.appName + '.' + dirName + '"';
        });
        //setting new html2js config
        grunt.config.set('html2js', html2js);

        // add module subtasks to the concat task in initConfig
        grunt.config.set('concat', concat);

        //setting all modules replace string
        var replace = grunt.config.get('replace') || {};
        replace.allModulesInMainJs.options.patterns[0].replacement = allModulesReplaceStr;
        grunt.config.set('replace', replace);
    });

    grunt.registerTask('build', [
        'clean:server',
        'prepareConfiguration',
        'sass',
        'autoprefixer:main',
        'html2js',
        'concat:build',
        'clean:html2JsTemplates',
        'concat:mainModule',
        'replace:allModulesInMainJs',
        'copy:build',
        'ngAnnotate'
    ]);

    grunt.registerTask('dist', [
        'jshint:all',
        'karma:build',
        'clean:dist',
        'build',
        'copy:dist',
        'ngAnnotate'
    ]);
};
