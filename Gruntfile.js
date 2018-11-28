"user strict";

// const imageminWebp = require('imagemin-webp');

module.exports = function(grunt) {
  grunt.initConfig({
    clean: {
      build: {
        src: ['./src/img/*.jpg']
      }
    },
    responsive_images: {
      myTask: {
        options: {
          sizes: [
            {
              name: "large",
              width: 1024
            },
            {
              name: "medium",
              width: 800
            },
            {
              name: "small",
              width: 320
            }
          ]
        },
        files: [
          {
            expand: true,
            cwd: "./src/img_original",
            src: ["**.{jpg,gif,png}"],
            dest: "./src/img"
          }
        ]
      }
    },

    // Just going to leave this here as a reference, I know it is ugly.
    // imagemin: {
    //   // dynamic: {
    //     options: {
    //       // optimizationLevel: 8,
    //       // progressive: true,
    //       svgoPlugins: [{ removeViewBox: false }],
    //       use: [imageminWebp({quality: 50})]
    //     },
    //     files: [
    //       {
    //         expand: true,
    //         cwd: "./src/img_resized",
    //         src: ["**/*.{png,jpg,jpeg,gif}"],
    //         dest: "./src/img"
    //       }
    //     ]
    //   // }
    // }
  });
  // Load the plugin that provides the task we need to perform.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks("grunt-responsive-images");
  // grunt.loadNpmTasks("grunt-contrib-imagemin");

  // Default task(s).
  grunt.registerTask("default", ["clean", "responsive_images"]);
  // grunt.registerTask("min", ["imagemin"]);
};
