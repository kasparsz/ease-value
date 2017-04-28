/*!
 * ease-value <https://github.com/kasparsz/ease-value>
 *
 * Copyright (c) 2017, Kaspars Zuks.
 * Licensed under the MIT License.
 */


var timing = (function () {
    if (typeof performance !== 'undefined') {
        return performance;
    } else {
        return Date;
    }
})();

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
    this.time = null;
    this.timer = null;

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
        this.to(options.value);
    }
};

var staticAccessors = { Defaults: {} };

/**
 * Destructor
 */
staticAccessors.Defaults.get = function () {
    return {
        'value': null,
        'force': EaseValue.defaultForce,
        'precision': EaseValue.defaultPrecision,
        'easing': EaseValue.defaultEasing,
    };
};

EaseValue.prototype.destroy = function destroy () {
    this.listeners = this.options = {};

    if (this.timer) {
        cancelAnimationFrame(this.timer);
    }
};

/**
 * Set target value
 *
 * @param {any} valueCurrent
 *
 * @memberOf EaseValue
 */
EaseValue.prototype.to = function to (value) {
    if (!this.hasInitialValueSet) {
        this.reset(value);
    } else {
        this.valueInitial = this.value;
        this.valueTarget = value;

        if (!this.isRunning) {
            this.time = timing.now();

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
        this.time = timing.now();

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
    var   running;

    this.isRunning = running = true;

    if (this.hasInitialValueSet) {
        var valueTarget = this.valueTarget;
        var time = timing.now();
        var tdelta = time - this.time;

        // Calculate new value
        var value = easing.call(this, this, tdelta);
        var delta = value - this.valueRaw;

        // Animation is considered to be complete when it would be complete in
        // less than 1 step
        var isComplete = Math.abs(valueTarget - value) < precision;

        // Save value
        this.valueRaw = isComplete ? valueTarget : value;
        this.value = Math.round(this.valueRaw / precision) * precision;
        this.time = time;

        // If there was a change or this is the first call then we trigger
        // step event. We want to do it on first call to make sure 'step' is
        // called at least once
        if (delta || firstRun) {
            this.trigger('step');
        }

        if (isComplete) {
            this.isRunning = running = false;
            this.trigger('stop');
        }
    }

    if (running) {
        this.timer = requestAnimationFrame(this.stepBinded);
    }
};

Object.defineProperties( EaseValue, staticAccessors );


EaseValue.defaultForce = 0.1;
EaseValue.defaultPrecision = 0.01;
EaseValue.defaultEasing = 'easeOut';


EaseValue.easings = {
    'easeOut': function (ease, tdelta) {
        var delta = (ease.valueTarget - ease.valueRaw);
        var force = ease.options.force * tdelta / 16;

        if (delta > 0) {
            return Math.min(ease.valueTarget, ease.valueRaw + delta * force);
        } else {
            return Math.max(ease.valueTarget, ease.valueRaw + delta * force);
        }
    },

    'linear': function (ease, tdelta) {
        var delta = (ease.valueTarget - ease.valueRaw);
        var force = ease.options.force * tdelta / 16;

        if (delta > 0) {
            return Math.min(ease.valueTarget, ease.valueRaw + force);
        } else {
            return Math.max(ease.valueTarget, ease.valueRaw - force);
        }
    }
};


module.exports = EaseValue;
