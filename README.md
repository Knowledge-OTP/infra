## Testing

In order to run the tests run 'grunt test'

## Important

The dist directory is the package content when used as a dependency used by other apps, so remember to run 'grunt build'

## Repo structure

     /bower_components
     /dist
     /node_modules
     /src
         /core
                     config.js (znk.infra module declaration)
         /components
                     /{directory of component}
                                              module.js (component module declaration)
                                              /directives
                                              /services
                                              /controllers
     /test
     .bowerrc
     .gitignore
     .jshintrc
      bower.json
      Gruntfile.js
      package.json
      README.md