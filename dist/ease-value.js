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


/**
 * Event listener mixin with .on, .off and .trigger functionality
 */
var Events = function Events () {
    this.listeners = {};
};

/**
 * Add event listener
 *
 * @param {string} eventName
 * @param {function} callback
 */
Events.prototype.on = function on (eventName, callback) {
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
Events.prototype.off = function off (eventName, callback) {
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
Events.prototype.trigger = function trigger (eventName, value) {
    var callbacks = this.listeners[eventName];

    for (var i = 0, ii = callbacks ? callbacks.length : 0; i < ii; i++) {
        callbacks[i](value);
    }
};


var EaseValue = /*@__PURE__*/(function (Events) {
    function EaseValue (opts) {
        if ( opts === void 0 ) opts = {};

        Events.call(this);

        var options = this.options = Object.assign({}, this.constructor.Defaults, opts);

        this.value = null;
        this.valueRaw = null;
        this.valueInitial = null;
        this.valueTarget = null;

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
    }

    if ( Events ) EaseValue.__proto__ = Events;
    EaseValue.prototype = Object.create( Events && Events.prototype );
    EaseValue.prototype.constructor = EaseValue;

    var staticAccessors = { Defaults: { configurable: true } };

    /**
     * Destructor
     */
    staticAccessors.Defaults.get = function () {
        return {
            'value': null,
            'force': EaseValue.defaultForce,
            'precision': EaseValue.defaultPrecision,
            'easing': EaseValue.defaultEasing
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
                this.trigger('start', this.value);
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

            this.trigger('start', this.value);
            this.trigger('step', this.value);
            this.trigger('stop', this.value);
        }
    };

    /**
     * Perform animation setp
     *
     * @returns
     * @protected
     */
    EaseValue.prototype.step = function step () {
        var precision = this.options.precision;
        var easing = EaseValue.easings[this.options.easing];
        var firstRun = !this.isRunning;
        var   running;

        this.isRunning = running = true;

        if (this.hasInitialValueSet) {
            var valueTarget = this.valueTarget;
            var valueLast = this.value;
            var time = timing.now();
            var tdelta = time - this.time;

            // Calculate new value
            var value = easing.call(this, this, tdelta);

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
            var delta = valueLast - this.value;

            if (delta || firstRun) {
                this.trigger('step', this.value);
            }

            if (isComplete) {
                this.isRunning = running = false;
                this.trigger('stop', this.value);
            }
        }

        if (running) {
            this.timer = requestAnimationFrame(this.stepBinded);
        }
    };

    Object.defineProperties( EaseValue, staticAccessors );

    return EaseValue;
}(Events));


var EaseValueMultiple = /*@__PURE__*/(function (Events) {
    function EaseValueMultiple (easeValues) {
        var this$1 = this;

        Events.call(this);

        this.easeValues = easeValues;
        this.keys = Object.keys(easeValues);
        this.value = this.getValue();
        this.isRunning = this.getIsRunning();
        this.reqStart = this.reqStop = this.reqStep = null;

        this.triggerStart = this.triggerStart.bind(this);
        this.triggerStop = this.triggerStop.bind(this);
        this.triggerStep = this.triggerStep.bind(this);

        this.keys.forEach(function (name) {
            easeValues[name].on('start', this$1.handleStart.bind(this$1));
            easeValues[name].on('stop', this$1.handleStop.bind(this$1));
            easeValues[name].on('step', this$1.handleStep.bind(this$1));
            if (!this$1[name]) { this$1[name] = easeValues[name]; }
        });
    }

    if ( Events ) EaseValueMultiple.__proto__ = Events;
    EaseValueMultiple.prototype = Object.create( Events && Events.prototype );
    EaseValueMultiple.prototype.constructor = EaseValueMultiple;

    EaseValueMultiple.prototype.destroy = function destroy () {
        var easeValues = this.easeValues;

        if (this.reqStart) {
            cancelAnimationFrame(this.reqStart);
        }
        if (this.reqStop) {
            cancelAnimationFrame(this.reqStop);
        }
        if (this.reqStop) {
            cancelAnimationFrame(this.reqStop);
        }

        this.keys.forEach(function (name) {
            easeValues[name].destroy();
        });

        this.isRunning = false;
        this.easeValues = {};
        this.value = {};
        this.keys = [];
    };

    EaseValueMultiple.prototype.to = function to (values) {
        var easeValues = this.easeValues;

        this.keys.forEach(function (name) {
            if (name in values) {
                easeValues[name].to(values[name]);
            }
        });
    };

    EaseValueMultiple.prototype.reset = function reset (values) {
        var easeValues = this.easeValues;

        this.keys.forEach(function (name) {
            if (name in values) {
                easeValues[name].reset(values[name]);
            }
        });
    };

    EaseValueMultiple.prototype.getIsRunning = function getIsRunning () {
        var easeValues = this.easeValues;
        var activeEaseValues  = this.keys.filter(function (name) { return easeValues[name].isRunning; });
        return activeEaseValues.length > 0;
    };

    EaseValueMultiple.prototype.getValue = function getValue () {
        var easeValues = this.easeValues;
        var value = {};

        this.keys.forEach(function (name) {
            value[name] = easeValues[name].value;
        });

        return value;
    };

    EaseValueMultiple.prototype.triggerStart = function triggerStart () {
        this.reqStart = null;
        this.trigger('start', this.value);
    };

    EaseValueMultiple.prototype.triggerStop = function triggerStop () {
        this.reqStop = null;
        this.trigger('stop', this.value);
    };

    EaseValueMultiple.prototype.triggerStep = function triggerStep () {
        this.reqStep = null;
        this.trigger('step', this.value);
    };

    EaseValueMultiple.prototype.handleStart = function handleStart () {
        // Trigger only once, first time
        if (!this.isRunning) {
            if (this.reqStart) {
                cancelAnimationFrame(this.reqStart);
            }

            this.value = this.getValue();
            this.isRunning = this.getIsRunning();
            this.reqStart = requestAnimationFrame(this.triggerStart);
        }
    };

    EaseValueMultiple.prototype.handleStop = function handleStop () {
        this.isRunning = this.getIsRunning();

        if (!this.isRunning) {
            if (this.reqStop) {
                cancelAnimationFrame(this.reqStop);
            }

            this.value = this.getValue();
            this.reqStop = requestAnimationFrame(this.triggerStop);
        }
    };

    EaseValueMultiple.prototype.handleStep = function handleStep () {
        this.value = this.getValue();

        if (!this.reqStep) {
            this.reqStep = requestAnimationFrame(this.triggerStep);
        }
    };

    return EaseValueMultiple;
}(Events));

EaseValue.Events = Events;
EaseValue.EaseValueMultiple = EaseValueMultiple;

EaseValue.multiple = function (params) {
    return new EaseValueMultiple(params);
}


EaseValue.defaultForce = 0.1;
EaseValue.defaultPrecision = 0.01;
EaseValue.defaultEasing = 'easeOut';


EaseValue.easings = {
    'easeOut': function (ease, tdelta) {
        var valueDelta = (ease.valueTarget - ease.valueRaw);
        var force = ease.options.force * tdelta / 16;

        if (valueDelta > 0) {
            return Math.min(ease.valueTarget, ease.valueRaw + valueDelta * force);
        } else {
            return Math.max(ease.valueTarget, ease.valueRaw + valueDelta * force);
        }
    },

    'linear': function (ease, tdelta) {
        var valueDelta = (ease.valueTarget - ease.valueRaw);
        var force = ease.options.force * tdelta / 16;

        if (valueDelta > 0) {
            return Math.min(ease.valueTarget, ease.valueRaw + force);
        } else {
            return Math.max(ease.valueTarget, ease.valueRaw - force);
        }
    }
};


module.exports = EaseValue;
