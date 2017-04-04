/*!
 * ease-value <https://github.com/kasparsz/ease-value>
 *
 * Copyright (c) 2017, Kaspars Zuks.
 * Licensed under the MIT License.
 */

var EaseValue = function EaseValue (opts) {
    if ( opts === void 0 ) opts = {};

    var options = this.options = Object.assign({}, this.constructor.Defaults, opts);

    this.value = null;
    this.valueRaw = null;
    this.valueInitial = null;
    this.valueTarget = null;

    this.listeners = {};

    this.hasInitialValueSet = false;
    this.isRunning = false;

    this.stepBinded = this.step.bind(this);

    if (options.step) {
        this.on('step', options.step);
    }

    if (options.start) {
        this.on('start', options.start);
    }

    if (options.stop) {
        this.on('stop', options.stop);
    }

    if (options.value !== null) {
        this.set(options.value);
    }
};

var staticAccessors = { Defaults: {} };

/**
 * Set target value
 *
 * @param {any} valueCurrent
 *
 * @memberOf EaseValue
 */
staticAccessors.Defaults.get = function () {
    return {
        'value': null,
        'force': EaseValue.defaultForce,
        'precision': EaseValue.defaultPrecision,
        'easing': EaseValue.defaultEasing,
    };
};

EaseValue.prototype.to = function to (value) {
    if (!this.hasInitialValueSet) {
        this.reset(value);
    } else {
        this.valueInitial = this.value;
        this.valueTarget = value;

        if (!this.isRunning) {
            // Trigger 'start' event
            this.trigger('start');
            this.step();
        }
    }
};

/**
 * Reset value / state
 *
 * @param {any} eventName
 * @param {any} callback
 *
 * @memberOf EaseValue
 */
EaseValue.prototype.reset = function reset (value) {
    var precision = this.options.precision;

    if (value !== this.valueRaw || value !== this.valueTarget) {
        this.valueRaw = this.valueInitial = this.valueTarget = value;
        this.value = Math.round(value / precision) * precision;
        this.hasInitialValueSet = true;

        this.trigger('start');
        this.trigger('step');
        this.trigger('stop');
    }
};

/**
 * Add event listener
 *
 * @param {string} eventName
 * @param {function} callback
 */
EaseValue.prototype.on = function on (eventName, callback) {
    var listeners = this.listeners;

    if (typeof callback === 'function') {
        listeners[eventName] = listeners[eventName] || [];
        listeners[eventName].push(callback);
    }
};

/**
 * Remove event listener
 *
 * @param {string} eventName
 * @param {function} callback
 */
EaseValue.prototype.off = function off (eventName, callback) {
    var callbacks = this.listeners[eventName];
    var index = callbacks ? callbacks.indexOf(callback) : -1;

    if (index !== -1) {
        callbacks.splice(index, 1);
    }
};

/**
 * Trigger event listeners
 *
 * @param {string} eventName
 * @protected
 */
EaseValue.prototype.trigger = function trigger (eventName) {
    var callbacks = this.listeners[eventName];
    var value = this.value;

    for (var i = 0, ii = callbacks ? callbacks.length : 0; i < ii; i++) {
        callbacks[i](value);
    }
};

/**
 * Perform animation setp
 *
 * @returns
 * @protected
 */
EaseValue.prototype.step = function step () {
    var force = this.options.force;
    var precision = this.options.precision;
    var easing = EaseValue.easings[this.options.easing];
    var firstRun = !this.isRunning;

    this.isRunning = true;

    if (this.hasInitialValueSet) {
        var valueTarget = this.valueTarget;

        // Calculate new value
        var value = easing.call(this, this);
        var delta = value - this.valueRaw;

        // Animation is considered to be complete when it would be complete in
        // less than 1 step
        var isComplete = Math.abs(valueTarget - value) < precision;

        // Save value
        this.valueRaw = value;
        this.value = Math.round(value / precision) * precision;

        // If there was a change or this is the first call then we trigger
        // step event. We want to do it on first call to make sure 'step' is
        // called at least once
        if (delta || firstRun) {
            this.trigger('step');
        }

        if (isComplete) {
            this.isRunning = false;
            this.trigger('stop');
        }
    }

    if (this.isRunning) {
        requestAnimationFrame(this.stepBinded);
    }
};

Object.defineProperties( EaseValue, staticAccessors );


EaseValue.defaultForce = 0.1;
EaseValue.defaultPrecision = 0.01;
EaseValue.defaultEasing = 'easeOut';


EaseValue.easings = {
    'easeOut': function (ease) {
        return ease.valueRaw + (ease.valueTarget - ease.valueRaw) * ease.options.force;
    }
};


module.exports = EaseValue;
