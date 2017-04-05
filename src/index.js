/*!
 * ease-value <https://github.com/kasparsz/ease-value>
 *
 * Copyright (c) 2017, Kaspars Zuks.
 * Licensed under the MIT License.
 */

class EaseValue {

    static get Defaults () {
        return {
            'value': null,
            'force': EaseValue.defaultForce,
            'precision': EaseValue.defaultPrecision,
            'easing': EaseValue.defaultEasing,
        };
    }


    constructor (opts = {}) {
        const options = this.options = {...this.constructor.Defaults, ...opts};

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
                // Trigger 'start' event
                this.trigger('start');
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

            this.trigger('start');
            this.trigger('step');
            this.trigger('stop');
        }
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
    trigger (eventName) {
        const callbacks = this.listeners[eventName];
        const value     = this.value;

        for (let i = 0, ii = callbacks ? callbacks.length : 0; i < ii; i++) {
            callbacks[i](value);
        }
    }

    /**
     * Perform animation setp
     *
     * @returns
     * @protected
     */
    step () {
        const force = this.options.force;
        const precision = this.options.precision;
        const easing = EaseValue.easings[this.options.easing];
        const firstRun = !this.isRunning;

        this.isRunning = true;

        if (this.hasInitialValueSet) {
            const valueTarget = this.valueTarget;

            // Calculate new value
            const value = easing.call(this, this);
            const delta = value - this.valueRaw;

            // Animation is considered to be complete when it would be complete in
            // less than 1 step
            const isComplete = Math.abs(valueTarget - value) < precision;

            // Save value
            this.valueRaw = isComplete ? valueTarget : value;
            this.value = Math.round(this.valueRaw / precision) * precision;

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
    }

}


EaseValue.defaultForce = 0.1;
EaseValue.defaultPrecision = 0.01;
EaseValue.defaultEasing = 'easeOut';


EaseValue.easings = {
    'easeOut': function (ease) {
        return ease.valueRaw + (ease.valueTarget - ease.valueRaw) * ease.options.force;
    }
};


module.exports = EaseValue;
