
/**
 * Module dependencies.
 */

var max = require('max-component')
  , sum = require('sum-component');

/**
 * Expose `GridView`.
 */

exports = module.exports = GridView;

/**
 * Default symbol map.
 */
 
exports.symbols = {
  ok: '✓',
  error: '✖',
  none: ' '
};

/**
 * Default color map.
 */

exports.colors = {
  ok: 32,
  error: 31,
  none: 0
};

/**
 * Initialize a grid view with the given `cloud` client.
 *
 * @param {Cloud} cloud
 * @param {Context} ctx
 * @api public
 */

function GridView(cloud, ctx) {
  this.ctx = ctx;
  this.cloud = cloud;
  this.browsers = cloud.browsers;
  this.max = this.maxWidth();

  cloud.on('init', this.oninit.bind(this));
  cloud.on('start', this.onstart.bind(this));
  cloud.on('end', this.onend.bind(this));
}

/**
 * Compute the max width.
 *
 * @return {Number}
 * @api private
 */

GridView.prototype.maxWidth = function(){
  return max(this.browsers, function(b){
    return Math.max(b.browserName.length + b.version.length + 1, b.platform.length)
  });
};

/**
 * Size to `w` / `h`.
 *
 * @param {Number} w
 * @param {Number} h
 * @return {GridView} self
 * @api public
 */

GridView.prototype.size = function(w, h){
  this.w = w;
  this.h = h;
  return this;
};

/**
 * Handle init events.
 */

GridView.prototype.oninit = function(browser){
  browser.state = 'init';
  this.draw(this.ctx);
};

/**
 * Handle start events.
 */

GridView.prototype.onstart = function(browser){
  browser.state = 'start';
  this.draw(this.ctx);
};

/**
 * Handle end events.
 */

GridView.prototype.onend = function(browser, res){
  browser.state = 'end';
  browser.results = res;
  this.draw(this.ctx);
};

/**
 * Return symbol for `browser` based on its state.
 *
 * @param {Object} browser
 * @return {String}
 * @api private
 */

GridView.prototype.symbolFor = function(browser){
  if (browser.state == 'fail' || (browser.results && browser.results.failures)) return exports.symbols.error;
  else if ('end' != browser.state) return exports.symbols.none;
  else return exports.symbols.ok;
};

/**
 * Return color for `browser` based on its state.
 *
 * @param {Object} browser
 * @return {Number}
 * @api private
 */

GridView.prototype.colorFor = function(browser){
  if (browser.state == 'fail' || (browser.results && browser.results.failures)) return exports.colors.error;
  if ('end' != browser.state) return exports.colors.none;
  return exports.colors.ok;
};

/**
 * Sum of the total failures.
 *
 * @return {Number}
 * @api public
 */

GridView.prototype.totalFailures = function(){
  return sum(this.browsers, 'results.failures');
};

/**
 * Output failures.
 *
 * @api public
 */

GridView.prototype.showFailures = function(){
  this.browsers.forEach(function(browser){
    var n = 0;
    var res = browser.results;
    if (!res) throw new Error('no results for ' + format(browser));
    if (!res.failures) return;
    var failed = res.failed;
    console.log();
    console.log('   %s %s', browser.browserName, browser.version);
    console.log('   \033[90m%s\033[m', browser.platform);
    failed.forEach(function(test){
      var err = test.error;
      var msg = err.message || '';
      var stack = err.stack || msg;
      var i = stack.indexOf(msg) + msg.length;
      msg = stack.slice(0, i);
      console.log();
      console.log('    %d) %s', ++n, test.fullTitle);
      console.log('\033[31m%s\033[m', stack.replace(/^/gm, '       '));
    });
    console.log();
  });
};

/**
 * Render to `ctx`.
 *
 * @api public
 */

GridView.prototype.draw = function(ctx){
  var self = this;
  var max = this.max;
  var w = this.w;
  var h = this.h;
  var x = 4;
  var y = 3;

  this.browsers.forEach(function(browser){
    if (x + max > w - 5) { y += 3; x = 4; }
    var sym = self.symbolFor(browser);
    var color = self.colorFor(browser);
    var name = browser.browserName;
    var version = browser.version;
    var platform = browser.platform;
    var label = name + ' ' + version;

    var pad = Array(max - label.length).join(' ');
    var ppad = Array(max - platform.length + 2).join(' ');
    ctx.moveTo(x, y);
    ctx.write(label + pad);
    ctx.write(' \033[' + color + 'm' + sym + '\033[0m');
    ctx.moveTo(x, y + 1);
    ctx.write('\033[90m' + platform + ppad + '\033[0m');
    x += max + 6;
  });
  ctx.write('\n\n');
};

/**
 * Format browser string.
 */

function format(b) {
  return b.browserName + ' ' + b.version + ' on ' + b.platform;
}

// browser name to grid browser name
var browser_map = {
    "Chrome"            : "chrome"
  , "Safari"            : "safari"
  , "Mobile Safari"     : "iphone"
  , "Opera"             : "opera"
  , "Internet Explorer" : "internet explorer"
  , "Firefox"           : "firefox"
  , "Android"           : "android"
};

// browser platform name to grid platform name
var platform_map = {
    "Windows XP"        : "Windows 2003"
  , "Windows 7"         : "Windows 2008"
  , "Windows 8"         : "Windows 2012"
  , "iOS 5.08"          : "Mac 10.6"
  , "Mac OS X 10.6.8"   : "Mac 10.6"
  , "Linux"             : "Linux"
  , "Linuxux"           : "Linux"
  , "Linuxx"            : "Linux"
}; 
exports.browser_map = browser_map;
exports.platform_map = platform_map;

/**
 * Mark this browser as having failed
 */
GridView.prototype.markErrored = function (name, version, platform, cloud) {

  //console.log("looking for " + name + " | " + version + " | " + platform);

  var cloudName = browser_map[name];
  var cloudPlatform = platform_map[platform];

  this.browsers.forEach(function (browser) {
    var name = browser.browserName;
    var version = browser.version;

    //console.log("itr: " + name + " | " + browser.platform + " | " + version);

    if (browser.browserName && cloudName && 
        browser.browserName.toLowerCase() == cloudName.toLowerCase() && 
        browser.platform.toLowerCase() == cloudPlatform.toLowerCase()) {
      
        browser.state = 'fail';

        //if (cloud) cloud.stop_browser(browser);
        //console.log("found browser " + name + " | platform - " + cloudPlatform + " | version " + version);
    }
  });

  //console.log(this.ctx);
  this.draw(this.ctx);

};
