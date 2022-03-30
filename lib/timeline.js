/*!
 * timeline.js - A javascript timeline component using SVG graphics.
 * @version 1.00.001
 * https://github.com/AndiSHFR/timeline.js
 *
 * @copyright Andreas Schaefer <asc@schaefer-it.net>
 * @license MIT
 *
 */
;

(function(root, factory) {
  /* istanbul ignore next */
  if (typeof define === 'function' && define.amd) {
    define(function() {
      return factory(root, root.document)
    })
  } else if (typeof exports === 'object') {
    module.exports = root.document ? factory(root, root.document) : function(w) {
      return factory(w, w.document)
    }
  } else {
    root.Timeline = factory(root, root.document)
  }
}(typeof window !== 'undefined' ? window : this, function(window, document, undefined) {
  'use strict';


  var Utils = {
    extend: function() {
      var
        isPlainObject = function(o) {
          return (o && 'object' == typeof o && !(o instanceof Date));
        },
        args = [].slice.call(arguments),
        result = args.shift();
      for (var i = 0; i < args.length; i++) {
        for (var prop in args[i]) {
          if (args[i].hasOwnProperty(prop)) {
            //            if(args[i][prop]) console.log(prop, args[i][prop], typeof args[i][prop], typeof args[i][prop].constructor, isPlainObject(args[i][prop]));
            if (isPlainObject(args[i][prop])) {
              result[prop] = Utils.extend(result[prop] || {}, args[i][prop]);
            } else {
              result[prop] = args[i][prop];
            }
          }
        }
      }
      return result;
    },

    isDOMElement(o) {
      return (
        typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
        o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName === "string"
      )
    },

    parseDate: function(d) {
      return (!d ? null :
        d.constructor === Date ? new Date(d) :
        d.constructor === Number ? new Date(d) :
        d.constructor === String ? new Date(d) :
        d.constructor === Array ? new Date(d[0], d[1], d[2]) :
        typeof d === "object" ? new Date(d.year, d.month, d.date) :
        null
      );
    },

    roundDate: function(d, coeff) {
      return new Date(Math.round(d.getTime() / coeff) * coeff);
    },

    formatDateTime: function(date, format) {
      if (!(date instanceof Date)) throw new Error('Invalid argument! date must be of type Date.');
      var
        second = date.getSeconds(),
        minute = date.getMinutes(),
        hour = date.getHours(),
        day = date.getDate(),
        month = 1 + date.getMonth(),
        year = date.getYear(),
        map = {
          ss: (second < 10 ? '0' + second : second),
          s: second,

          mm: (minute < 10 ? '0' + minute : minute),
          m: minute,

          hh: (hour < 10 ? '0' + hour : hour),
          h: hour,

          DD: (day < 10 ? '0' + day : day),
          D: day,

          MM: (month < 10 ? '0' + month : month),
          M: month,

          YYYY: (year < 1000 ? 1900 + year : year),
          YY: year % 100,
        },
        result = format;

      return format.replace(
        /(ss|mm|hh|DD|MM|YYYY|s|m|h|D|M|YY)/g,
        function(_, type) {
          return map[type];
        }
      );
    }

  };


  var Svg = {

    namespace: 'http://www.w3.org/2000/svg',

    isAvalable: function() {
      return !!this.createTag('svg').createSVGRect;
    },

    createTag: function(tag) {
      var tag = document.createElementNS(this.namespace, tag);
      if (tag) {
        tag.setAttr = function(name, value) {
          if ('string' === typeof name) {
            this.setAttributeNS(null, name, value);
          } else {
            for (var prop in name) {
              this.setAttributeNS(null, prop, name[prop]);
            }
          }
          return this;
        }
      }
      return tag;
    },

    createSvg: function(width, height, options) {
      var tag = this.createTag('svg');
      tag.setAttribute('xmlns', Svg.namespace);
      tag.setAttr({
        version: '1.1',
        width: width,
        height: height
      });
      tag.setAttr(options);
      return tag;
    },

    createGroup: function(options) {
      var tag = this.createTag('group');
      tag.setAttr(options);
      return tag;
    },

    createLine: function(x1, y1, x2, y2, options) {
      var tag = this.createTag('line');
      tag.setAttr({
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2
      });
      tag.setAttr(options);
      return tag;
    },

    createCircle: function(cx, cy, r, options) {
      var tag = this.createTag('circle');
      tag.setAttr({
        cx: cx,
        cy: cy,
        r: r
      });
      tag.setAttr(options);
      return tag;
    },

    createRect: function(x, y, width, height, options) {
      var tag = this.createTag('rect');
      tag.setAttr({
        x: x,
        y: y,
        width: width,
        height: height
      });
      tag.setAttr(options);
      return tag;
    },

    createText: function(x, y, text, options) {
      var tag = this.createTag('text');
      tag.setAttr({
        x: x,
        y: y
      });
      tag.textContent = text;
      tag.setAttr(options);
      return tag;
    },

    getTextDimension: function(text, options) {
      var
        namespace = 'http://www.w3.org/2000/svg',
        div = document.createElement('div'),
        svg = document.createElementNS(namespace, 'svg'),
        txt = document.createElementNS(namespace, 'text');

      for (var prop in options) {
        txt.setAttributeNS(null, prop, options[prop]);
      }
      txt.textContent = text;

      svg.appendChild(txt);
      div.appendChild(svg);
      document.body.appendChild(div);
      var bBox = txt.getBBox();
      div.parentNode.removeChild(div);
      return {
        width: bBox.width,
        height: bBox.height
      }
    }

  }


  /**
   * Constructor for Timeline.
   * @param container DOMelement DOM element acting as the container for this component.
   * @param options object || undefined Object with configuration options.
   * @return this
   */
  var Timeline = function(container, options) {
    if (!(this instanceof Timeline)) return new Timeline(container, options);

    if (!Svg.isAvalable()) throw new Error('Browser does not support SVG.');
    if (!Utils.isDOMElement(container)) throw new Error('Container is not a DOM element.');

    this.options = Utils.extend({}, Timeline.DEFAULTS, options);
    this.container = container;
    if (this.options.debug && console) console.log('Timeline()', this, container, options);
    this.refresh();
    return this;
  }

  Timeline.DEFAULTS = {
    debug: false,
    marginLeft: 50,
    marginRight: 50,
    marginTop: 20,
    marginBottom: 10,
    // a maximum of 50% of the scales width should be filled with labels (= major ticks)
    scaleFillFactor: 0.5,
    scaleFormat: 'hh:mm',
    scaleFontSize: '12pt',
    scaleColor: '#808080',
    scaleWidth: 4,
    scaleMajorTickLength: 20,
    scaleMinorTickLength: 10,
    scaleBottomMargin: 20,
    minorTicks: null,
    majorTicks: null,
    dataLineHeight: null,
    dataColor: '#008000',
    dataWidth: 3,
    dataBulletRadius: 4,
    dataOffset: 5,
    dataFontSize: '16pt',
    mapDataItem: function(i) {
      return i;
    }
  };


  Timeline.prototype.createSvg = function(data) {
    var
      innerWidth = this.container.clientWidth,
      drawLeft = this.options.marginLeft,
      drawRight = innerWidth - this.options.marginRight,
      posY = this.options.marginTop,
      svg = Svg.createSvg(innerWidth, innerHeight),

      scaleWidth = drawRight - drawLeft,
      scaleStart = this.options.startDateTime,
      scaleEnd = this.options.endDateTime,
      scaleDuration = 0,
      majorTicks = this.options.majorTicks,
      minorTicks = this.options.minorTicks;


    // If we have data and start or end date is not set, set it from the data
    if (this.data && (!scaleStart || !scaleEnd)) {
      var minDate = new Date(8640000000000000),
        maxDate = new Date(-8640000000000000);
      for (var i = 0; i < data.length; i++) {
        var tmpDate = Utils.parseDate(data[i].date);
        if (tmpDate.getTime() > maxDate.getTime()) maxDate = new Date(tmpDate);
        if (tmpDate.getTime() < minDate.getTime()) minDate = new Date(tmpDate);
        if (this.options.debug && console) console.log({
          pit: data[i].date,
          tmpDate: tmpDate,
          minDate: minDate,
          maxDate: maxDate
        });
      }
      if (!scaleStart) scaleStart = minDate;
      if (!scaleEnd) scaleEnd = maxDate;
    }

    scaleStart = Utils.parseDate(scaleStart);
    scaleEnd = Utils.parseDate(scaleEnd);

    if (scaleStart && scaleEnd) {
      scaleDuration = Math.abs(scaleEnd.getTime() - scaleStart.getTime());

      if (!majorTicks) {
        var
          scaleTextDimension = Svg.getTextDimension(
            Utils.formatDateTime(new Date(), this.options.scaleFormat), {
              'text-anchor': 'middle',
              'dominant-baseline': 'baseline',
              fill: this.options.scaleColor,
              'font-size': this.options.scaleFontSize
            }
          ),
          maxNumberOfMarjorTicks = (scaleWidth / scaleTextDimension.width) * this.options.scaleFillFactor,
          minMajorTicks = scaleDuration / maxNumberOfMarjorTicks / 1000;

        var humanMajorTicks = [
          1.0, 2.0, 5.0, 10.0, 15.0, 30.0, /* SECONDS  */
          60.0, 120.0, 300.0, 600.0, 900.0, 1800.0, /* MINUTES  */
          3600.0, 7200.0, 10800.0, 21600.0, 43200.0, /* HOURS    */
          86400.0, 172800.0, 604800.0, 1209600.0, /* DAYS     */
          2419200.0, 4838400.0, 7257600.0, 14515200.0, /* MONTH    */
          29030400.0, 2 * 29030400.0, 5 * 29030400.0 /* YEARS    */
        ];

        if (minMajorTicks <= 0) minMajorTicks = humanMajorTicks[humanMajorTicks - 1];

        var calculatedMajorTicks = minMajorTicks;
        var calculatedMinorTicks = null;
        for (var i = 0; i < humanMajorTicks.length - 1; i++) {
          if (humanMajorTicks[i] >= minMajorTicks) {
            calculatedMajorTicks = humanMajorTicks[i];
            calculatedMinorTicks = (i > 2 ? humanMajorTicks[i - 2] : null); // Why -2? check the steps above even vs. odd
            break;
          }
        }

        majorTicks = calculatedMajorTicks;
        minorTicks = calculatedMinorTicks;
      }

      var
        pointInTime = Utils.roundDate(scaleStart, minorTicks * 1000),
        y2 = posY + this.options.scaleMajorTickLength,
        y1 = y2 - this.options.scaleMinorTickLength;

      if (minorTicks) {
        while (pointInTime.getTime() <= scaleEnd.getTime()) {
          if (pointInTime.getTime() >= scaleStart.getTime()) {
            var posX = drawLeft + scaleWidth * ((pointInTime - scaleStart) / scaleDuration);
            svg.appendChild(Svg.createLine(posX, y1, posX, y2, {
              stroke: this.options.scaleColor,
              'stroke-width': 2
            }));
          }
          pointInTime.setSeconds(pointInTime.getSeconds() + minorTicks);
        }
      }

      pointInTime = Utils.roundDate(scaleStart, majorTicks * 1000),
        y1 = posY;
      y2 = posY + this.options.scaleMajorTickLength;

      while (pointInTime.getTime() <= scaleEnd.getTime()) {
        if (pointInTime.getTime() >= scaleStart.getTime()) {
          var posX = drawLeft + scaleWidth * ((pointInTime - scaleStart) / scaleDuration);
          svg.appendChild(Svg.createLine(posX, y1, posX, y2, {
            stroke: this.options.scaleColor,
            'stroke-width': 2
          }));
          svg.appendChild(Svg.createText(posX, y1 - 2, Utils.formatDateTime(pointInTime, this.options.scaleFormat), {
            'text-anchor': 'middle',
            'dominant-baseline': 'baseline',
            fill: this.options.scaleColor,
            'font-size': this.options.scaleFontSize
          }));
        }
        pointInTime.setSeconds(pointInTime.getSeconds() + majorTicks);
      }

      posY += this.options.scaleMajorTickLength;

      svg.appendChild(Svg.createLine(drawLeft, posY, drawRight, posY, {
        stroke: this.options.scaleColor,
        'stroke-width': this.options.scaleWidth
      }));

      posY += this.options.scaleWidth / 2 + this.options.scaleBottomMargin;

      if (this.data) {
        var lineHeight = this.options.dataLineHeight | 
                         Svg.getTextDimension('gyMI', { 'font-size': this.options.dataFontSize }).height;

        for (var i = 0; i < this.data.length; i++) {
          var
            item = this.options.mapDataItem(this.data[i]),
            itemColor = item.color || this.options.dataColor,
            startDate = Utils.parseDate(item.start),
            endDate = Utils.parseDate((item.end ? item.end : new Date()))

          if (startDate.getTime() <= scaleEnd.getTime()) {
            var
              DateMin = function(a, b) {
                return (a.getTime() < b.getTime() ? a : b);
              },
              DateMax = function(a, b) {
                return (a.getTime() > b.getTime() ? a : b);
              },
              posX1 = drawLeft + scaleWidth * ((DateMax(scaleStart, startDate) - scaleStart) / scaleDuration),
              posX2 = drawLeft + scaleWidth * ((DateMax(scaleStart, DateMin(scaleEnd, endDate)) - scaleStart) / scaleDuration);

            if (startDate.getTime() >= scaleStart.getTime()) {
              svg.appendChild(Svg.createCircle(posX1, posY, this.options.dataBulletRadius, {
                fill: itemColor
              }));
            }

            svg.appendChild(Svg.createText(posX1 - this.options.dataWidth * 2 - this.options.dataOffset, posY, data[i].label, {
              'text-anchor': 'end',
              'dominant-baseline': 'middle',
              fill: itemColor,
              'font-size': this.options.dataFontSize
            }));

            if (endDate.getTime() >= scaleStart.getTime()) {
              svg.appendChild(Svg.createLine(posX1, posY, posX2, posY, {
                stroke: itemColor,
                'stroke-width': this.options.dataWidth
              }));
              if (item.end && endDate.getTime() <= scaleEnd.getTime()) {
                svg.appendChild(Svg.createCircle(posX2, posY, this.options.dataBulletRadius, {
                  fill: itemColor
                }));
              }
            }

          };

          posY += lineHeight;
        }

      }

    } // if(scaleStart && scaleEnd) { ...

    svg.setAttr('height', posY + this.options.marginBottom);

    if (this.options.debug && console) console.log('createSvg(): svg =', svg);

    return svg;
  }

  Timeline.prototype.refresh = function() {
    if (this.options.debug && console) console.log('refresh()', this);
    var firstChild = this.container.firstChild;
    while (firstChild) {
      this.container.removeChild(firstChild);
      firstChild = this.container.firstChild;
    }
    this.container.appendChild(this.createSvg(this.data));
  }

  Timeline.prototype.setData = function(data) {
    if (this.options.debug && console) console.log('setData()', this, data);
    this.data = data;
    this.refresh();
  }

  Timeline.prototype.setPeriod = function(start, end) {
    if (this.options.debug && console) console.log('setPeriod()', this, start, end);
    this.options.startDateTime = start;
    this.options.endDateTime = end;
    this.refresh();
  }

  return Timeline;
}));
