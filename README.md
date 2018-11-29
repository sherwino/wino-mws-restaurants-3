# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

## Project Overview: Stage 3

Project Overview

For the Restaurant Reviews projects, you will incrementally convert a static webpage to a mobile-ready web application. In Stage Two, you will take the responsive, accessible design you built in [Stage Two](https://github.com/sherwino/wino-mws-restaurants-2) and connect it to an external server. You’ll begin by using asynchronous JavaScript to request JSON data from the server. You’ll store data received from the server in an offline database using IndexedDB, which will create an app shell architecture. Finally, you’ll work to optimize your site to meet performance benchmarks, which you’ll test using Lighthouse.

### Instructions

For up to date instructions go to [docs](./docs/INSTRUCTIONS.md)

### To Run This Project Locally

1. Clone or Download this repository. For this project to work you will need to have `node` installed, `npm`, and the `grunt-cli`. 

1. As soon as you have that installed you will need to run ```npm install```

1. Then navigate to the API by going to the `server` folder. ```cd server```, then run npm install there too ```npm install```.

1. When the node modules are ready in both folders, run ```npm run server``` in one terminal window to get the server going then open a another terminal window and run ```npm run client``` to get the gulp server. This will also run grunt to process the images, and then gulp's browser sync.

I foolishly started my work on my laptop, and then jumped to my desktop computer to finish the rest of it. Foolish because I have set up each environment up to be as similar as possible, but one is running Windows 10, and the other is running MacOs High Sierra. Some things are bound to be different, but the main thing that was affecting me locally was the version of Python. One system has 2.6+ and the other 3.6+ so I created some additional scripts to run a static server with each version of python. 

For Python 3 - ```npm run static:python3```

For Python 2 - ```npm run static```

### Screenshots

![Gif of the version two of the site](https://i.gyazo.com/9b46236aeb67a58d153fad66c1bea010.gif)

### Hosted Version of the Site

https://sherwino.github.io/wino-mws-restaurants-3/dist/


#### Things I have learned

It is not smart to spend all of your time editing a Gulp && Grunt file that is not even being executed in the first place. The whole time I was editing the files inside the src folder, but those are not the ones running with my start scripts. No wonder I haven't been seeing any results.

GoogleMaps has lowered my lighthouse 3.0 score, and I don't know how to fix it yet. 
[View my last score here](https://sherwino.github.io/wino-mws-restaurants-3/dist/lighthouse.html) and if you have any pointers on how I could improce this let me know.

