/*!
 * ease-value <https://github.com/kasparsz/ease-value>
 *
 * Copyright (c) 2017, Kaspars Zuks.
 * Licensed under the MIT License.
 */


const timing = (function () {
    if (typeof performance !== 'undefined') {
        return performance;
    } else {
        return Date;
    }
})();


/**
 * Event listener mixin with .on, .off and .trigger functionality
 */
class Events {

    constructor () {
        this.listeners = {};
    }

    /**
     * Add event listener
     *
     * @param {string} eventName
     * @param {function} callback
     */
    on (eventName, callback) {
        const listeners = this.listeners;

        if (typeof callback === 'function') {
            listeners[eventName] = listeners[eventName] || [];
            listeners[eventName].push(callback);
        }
    }

    /**
     * Remove event listener
     *
     * @param {string} eventName
     * @param {function} callback
     */
    off (eventName, callback) {
        const callbacks = this.listeners[eventName];
        const index     = callbacks ? callbacks.indexOf(callback) : -1;

        if (index !== -1) {
            callbacks.splice(index, 1);
        }
    }

    /**
     * Trigger event listeners
     *
     * @param {string} eventName
     * @protected
     */
    trigger (eventName, value) {
        const callbacks = this.listeners[eventName];

        for (let i = 0, ii = callbacks ? callbacks.length : 0; i < ii; i++) {
            callbacks[i](value);
        }
    }
}


class EaseValue extends Events {

    static get Defaults () {
        return {
            'value': null,
            'force': EaseValue.defaultForce,
            'precision': EaseValue.defaultPrecision,
            'easing': EaseValue.defaultEasing
        };
    }


    constructor (opts = {}) {
        super();

        const options = this.options = Object.assign({}, this.constructor.Defaults, opts);

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

    /**
     * Destructor
     */
    destroy () {
        this.listeners = this.options = {};

        if (this.timer) {
            cancelAnimationFrame(this.timer);
        }
    }

    /**
     * Set target value
     *
     * @param {any} valueCurrent
     *
     * @memberOf EaseValue
     */
    to (value) {
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
    }

    /**
     * Reset value / state
     *
     * @param {any} eventName
     * @param {any} callback
     *
     * @memberOf EaseValue
     */
    reset (value) {
        const precision = this.options.precision;

        if (value !== this.valueRaw || value !== this.valueTarget) {
            this.valueRaw = this.valueInitial = this.valueTarget = value;
            this.value = Math.round(value / precision) * precision;
            this.hasInitialValueSet = true;
            this.time = timing.now();

            this.trigger('start', this.value);
            this.trigger('step', this.value);
            this.trigger('stop', this.value);
        }
    }

    /**
     * Perform animation setp
     *
     * @returns
     * @protected
     */
    step () {
        const precision = this.options.precision;
        const easing = EaseValue.easings[this.options.easing];
        const firstRun = !this.isRunning;
        let   running;

        this.isRunning = running = true;

        if (this.hasInitialValueSet) {
            const valueTarget = this.valueTarget;
            const valueLast = this.value;
            const time = timing.now();
            const tdelta = time - this.time;

            // Calculate new value
            const value = easing.call(this, this, tdelta);

            // Animation is considered to be complete when it would be complete in
            // less than 1 step
            const isComplete = Math.abs(valueTarget - value) < precision;

            // Save value
            this.valueRaw = isComplete ? valueTarget : value;
            this.value = Math.round(this.valueRaw / precision) * precision;
            this.time = time;

            // If there was a change or this is the first call then we trigger
            // step event. We want to do it on first call to make sure 'step' is
            // called at least once
            const delta = valueLast - this.value;

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
    }

}


class EaseValueMultiple extends Events {
    constructor (easeValues) {
        super();

        this.easeValues = easeValues;
        this.keys = Object.keys(easeValues);
        this.value = this.getValue();
        this.isRunning = this.getIsRunning();
        this.reqStart = this.reqStop = this.reqStep = null;

        this.triggerStart = this.triggerStart.bind(this);
        this.triggerStop = this.triggerStop.bind(this);
        this.triggerStep = this.triggerStep.bind(this);

        this.keys.forEach(name => {
            easeValues[name].on('start', this.handleStart.bind(this));
            easeValues[name].on('stop', this.handleStop.bind(this));
            easeValues[name].on('step', this.handleStep.bind(this));
            if (!this[name]) this[name] = easeValues[name];
        });
    }

    to (values) {
        const easeValues = this.easeValues;

        this.keys.forEach(name => {
            if (name in values) {
                easeValues[name].to(values[name]);
            }
        });
    }

    reset (values) {
        const easeValues = this.easeValues;

        this.keys.forEach(name => {
            if (name in values) {
                easeValues[name].reset(values[name]);
            }
        });
    }

    getIsRunning () {
        const easeValues = this.easeValues;
        const activeEaseValues  = this.keys.filter(name => easeValues[name].isRunning);
        return activeEaseValues.length > 0;
    }

    getValue () {
        const easeValues = this.easeValues;
        const value = {};

        this.keys.forEach(name => {
            value[name] = easeValues[name].value;
        });

        return value;
    }

    triggerStart () {
        this.reqStart = null;
        this.trigger('start', this.value);
    }

    triggerStop () {
        this.reqStop = null;
        this.trigger('stop', this.value);
    }

    triggerStep () {
        this.reqStep = null;
        this.trigger('step', this.value);
    }

    handleStart () {
        // Trigger only once, first time
        if (!this.isRunning) {
            if (this.reqStart) {
                cancelAnimationFrame(this.reqStart);
            }

            this.value = this.getValue();
            this.isRunning = this.getIsRunning();
            this.reqStart = requestAnimationFrame(this.triggerStart);
        }
    }

    handleStop () {
        this.isRunning = this.getIsRunning();

        if (!this.isRunning) {
            if (this.reqStop) {
                cancelAnimationFrame(this.reqStop);
            }

            this.value = this.getValue();
            this.reqStop = requestAnimationFrame(this.triggerStop);
        }
    }

    handleStep () {
        this.value = this.getValue();

        if (!this.reqStep) {
            this.reqStep = requestAnimationFrame(this.triggerStep);
        }
    }
}

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
        const delta = (ease.valueTarget - ease.valueRaw);
        const force = ease.options.force * tdelta / 16;

        if (delta > 0) {
            return Math.min(ease.valueTarget, ease.valueRaw + delta * force);
        } else {
            return Math.max(ease.valueTarget, ease.valueRaw + delta * force);
        }
    },

    'linear': function (ease, tdelta) {
        const delta = (ease.valueTarget - ease.valueRaw);
        const force = ease.options.force * tdelta / 16;

        if (delta > 0) {
            return Math.min(ease.valueTarget, ease.valueRaw + force);
        } else {
            return Math.max(ease.valueTarget, ease.valueRaw - force);
        }
    }
};


module.exports = EaseValue;
