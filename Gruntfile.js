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
                        '.tmp',
                        '<%= yeoman.dist %>/{,*/}*',
                        '!<%= yeoman.dist %>/.git{,*/}*'
                    ]
                }]
            },
            server: '.tmp'
        },

        // Automatically inject Bower components into the app
        wiredep: {
            demo:{
                src: 'demo/**/index.html'
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
            dist: {
                files:[{
                    src: ['.tmp/components/**/module.js', '.tmp/components/**/*.js', '.tmp/module.js'],
                    dest: '<%= yeoman.dist %>/<%= yeoman.appName %>.js'
                },{
                    src: ['<%= yeoman.dist %>/**/main.css','.tmp/general.css'],
                    dest: '<%= yeoman.dist %>/main.css'
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
                    src: '*.js',
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
                base: ['dist','bower_components'],
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
            jsAndHtml: {
                files: [
                    'src/**/*.js',
                    'src/**/*.{html,svg}'
                ],
                tasks: ['copy:copyComponentsToTmp','prepareConfiguration','html2js', 'concat']
            },
            demo: {
                files: [
                    'demo/**/*.*'
                ]
            },
            sass: {
                files:[
                    'src/**/*.scss'
                ],
                tasks: ['copy:copyComponentsToTmp','sass','autoprefixer:main']
            }
        },
        sass: {
            // options: {

            //     sourceMap: true
            // },
            allComponenets:{
                files:[{
                    expand: true,
                    cwd: '.tmp/components',
                    src: '**/main.scss',
                    dest: 'dist/',
                    ext: '.css'
                }]
            },
            general:{
                files:{
                    '.tmp/general.css': '<%= yeoman.src %>/scss/general.scss'
                }
            }
        },
        copy: {
            dist: {
                src: '.tmp/main.css',
                dest: 'dist/main.css'
            },
            copyComponentsToTmp:{
                files:[{
                    expand: true,
                    cwd: '<%= yeoman.src %>/components',
                    src: '**/*.*',
                    dest: '.tmp/components'
                },{
                    '.tmp/module.js': '<%= yeoman.src %>/core/module.js'
                }]
            }
        },
        html2js: {
            options:{
                module: 'znk.infra',
                singleModule: true,
                existingModule: true,
                base: '../infra/.tmp/'
            }
        },
        autoprefixer: {
            options: {
                browsers: ['last 2 versions']
            },
            main: {
                src: ['.tmp/main.css']
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

    grunt.registerTask('ci',function(){
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
            'sass',
            'connect:serve',
            'watch'
        ]);
    });

    grunt.registerTask('prepareConfiguration', 'preparing html2js and concat configuration for each component', function(){
        var concat = grunt.config.get('concat') || {};
        var html2js = grunt.config.get('html2js') || {};

        grunt.file.expand(".tmp/components/*").forEach(function (dir) {
            // get the module name from the directory name
            var dirName = dir.substr(dir.lastIndexOf('/')+1);

            html2js[dirName] = {
                options:{
                    module: 'znk.infra.' + dirName
                },
                src: [dir + '/**/*.{html,svg}'],
                dest: dir + '/templates.js'
            };

            // create a subtask for each module, find all src files
            // and combine into a single js file per component
            concat[dirName] = {
                src: [dir + '/module.js', dir + '/**/*.js'],
                dest: '<%= yeoman.dist %>/' + dirName + '/' + dirName + '.js'
            };
        });
        // add module subtasks to the concat task in initConfig
        grunt.config.set('html2js', html2js);
        grunt.config.set('concat', concat);
    });

    grunt.registerTask('build', [
        'jshint:all',
        'karma:build',
        'clean:dist',
        'copy:copyComponentsToTmp',
        'prepareConfiguration',
        'sass',
        'html2js',
        'concat',
        'copy:dist'
    ]);
};
