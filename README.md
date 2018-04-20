# timeline.js

A JavaScript module to show multiple durations with a label below a horizontal timescale.

![Timeline Screenshot](timeline-screenshot.png "Timeline Screenshot")

```timeline.js``` was created to visualize the use of pump inlets on a production line over time. 

Data was shown in a table view and it was hard to identify start, end, overlapping, gaps and more. So this graphical representation makes it way more easier to understand what is going on.

Because there where certain requirements regarding the way the usage of the pump inlets had to be displayed this small JavaScript module was created to visualize this data.

# Requirements
* A web browser with support for [SVG](https://en.wikipedia.org/wiki/Scalable_Vector_Graphics) graphics.

```timeline.js``` is a standalone JavaScript module. No other libraries are required.

# How to Install
* Either clone the repository or download the zip file.
* Copy the file ```timeline.js``` from the ```lib``` directory to a directory on your web server.

# How to Use
Here is a brief explanation how to use the module.

## Include the javascript file on your web page
Include the JavaScript file on your web page. In the example below the file resides in a subdirectory named ```js```.
```javascript  
    <script src="js/timeline.js"></script>
```
## Add a container element to your web page
Add a container element to your web page. The module will output the svg graphics into this container. ```timeline.js``` will fill the full width of the container. The height will be automatically set by the amount of data items.

```javascript  
    <div id="timelineContainer"></div>
```

__Hint:__ If you use a DIV element as the container it will fill the whole width of the parent. Otherwise you may have to set the desired width and height of the container manually.

## Create a timeline object
Add JavaScript code to create a timeline object.

```javascript
var timeline = Timeline(
  document.getElementById('container'), 
  {
    startDateTime: '2018-04-17 00:00:00',
    endDateTime: '2018-04-18 00:00:00',
  }
);
```


## Set data to display
Add JavaScript code to set the data to be displayed.

```javascript
timeline.setData([
  { label: 'P1', start: '2018-04-16 22:34:00', end: '2018-04-17 02:48:37' },
  { label: 'P2', start: '2018-04-17 06:06:43', end: null },
  { label: 'P3', start: '2018-04-17 14:00:43', end: '2018-04-17 15:00:00' },
  { label: 'P4', start: '2018-04-17 11:56:02', end: '2018-04-17 19:34:41' }
]);
```


## Full working example
Here is a minimal full working example.

```html
<html>
  <head>
    <title>Minimal Timeline Example</title>
    <script src="timeline.js"></script>    
  </head>
  <body>
    <h1>Minimal Timeline Example</h1>

    <div id="container"></div>

    <script>

      // Initialize the timeline instance
      var tl1 = Timeline(
        document.getElementById('container'), 
        {
          startDateTime: '2018-04-17 00:00:00',
          endDateTime: '2018-04-18 00:00:00',
        }
      );

      tl1.setData([
        { label: 'P1', start: '2018-04-16 22:34:00', end: '2018-04-17 02:48:37' },
        { label: 'P2', start: '2018-04-17 06:06:43', end: null },
        { label: 'P3', start: '2018-04-17 14:00:43', end: '2018-04-17 15:00:00' },
        { label: 'P4', start: '2018-04-17 11:56:02', end: '2018-04-17 19:34:41' }
      ]);

    </script>
  </body>
</html>
```


# Examples
You can find some basic examples in the ```examples``` directory.

* [minimal.html](examples/minimal.html)
* [colorfull.html](examples/colorfull.html)
* [live-update.html](examples/live-update.html)

# License
```timeline.js``` is published under [MIT](LICENSE) license.
