[npm-url]: https://npmjs.org/package/ease-value
[npm-image]: http://img.shields.io/npm/v/ease-value.svg
[travis-url]: https://travis-ci.org/kasparsz/ease-value
[travis-image]: http://img.shields.io/travis/kasparsz/ease-value.svg

# ease-value
[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url]

Value easing component which animates single value continuously.

Unlike standard animations EaseValue doesn't have a duration or fixed "to" value and can have "to" value changing frequently, for example
on mouse movement.

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm install ease-value --save
```

## Example

```js
import EaseValue from 'ease-value';

// Create animation with small 'force' value for smoother / slower animation
const mouseX = new EaseValue({'force': 0.1});
const mouseY = new EaseValue({'force': 0.1});

// On mouse movement update 'mouse' animation target value
document.addEventListener('mousemove', function (event) {
    mouseX.to(event.clientX);
    mouseY.to(event.clientY);
}, false);

// On animation step move demo box. Callback will be called twice per animation frame,
// once for mouseX and once for mouseY
mouseX.on('step', updateDemoBoxPosition);
mouseY.on('step', updateDemoBoxPosition);

function updateDemoBoxPosition (value) {
    document.querySelector('#demo-box').style.transform = `translate(${ mouseX.value }px, ${ mouseY.value }px)`;
});
```

To avoid callback being called more than once per animation frame we can use ```EaseValue.multiple(instances)``` and add listener to it instead.

```js
import EaseValue from 'ease-value';

// Listen to all events 
const mouse  = EaseValue.multiple({
    'x': new EaseValue({'force': 0.1}),
    'y': new EaseValue({'force': 0.1})
});

// On mouse movement update 'mouse' animation target value
document.addEventListener('mousemove', function (event) {
    mouse.to({
        'x': event.clientX,
        'y': event.clientY
    });

    // or you can access each EaseValue individually
    mouse.x.to(event.clientX);
    mouse.y.to(event.clientY);
}, false);

// On animation step move demo box
mouse.on('step', function (value) {
    document.querySelector('#demo-box').style.transform = `translate(${ value.x }px, ${ value.y }px)`;
});
```

## API

### `EaseValue([options])`

#### Options

| Name     | Type    | Usage                                    | Default  |
| -------- | ------- | ---------------------------------------- | -------- |
| ```force```    | Number | Amount of force used for animation / animation speed. Smaller the value, slower the animation will be | ```0.1```     |
| ```precision``` | Number | To prevent unneeded ```step``` event calls and to allow detecting animation end faster, animation value is rounded to this precision. For example with default precision, value between steps will not change by less than 0.01 | ```0.01``` |
| ```easing``` | String | Easing name, currently there is ```easeOut``` and ```linear``` easings | ```"easeOut"``` |
| ```value``` | Number | Initial value, optional. If initial value is not provided, then it will be set when calling ```to``` or ```reset``` for first time | null |

### `on(eventName, callback)`

Adds event listener. To callback is passed current value as first argument.

#### Event names

| Name     | Description  |
| -------- | ------- | ---------------------------------------- | -------- |
| ```start```    | Triggered when animation starts or when animation resumes after previously completing / stoping |
| ```stop```    | Triggered when animation completes / stops |
| ```step```    | Triggered on each animation step after value change, if value didn't changed between steps then 'step' callback won't be called |

### `off(eventName, callback)`

Removes event listener.

### `to(value)`

Set value to which animate to. Calling ```to``` for first time if ```value``` option was not provided is equivalent to calling ```reset```

### `reset(value)`

Set value without using animation, will instantly jump to this value.

### `destroy()`

Removes all listeners, stops animation


## Running tests

Install dev dependencies:

```sh
$ npm install -d && npm test
```

## License

Copyright © 2017, [Kaspars Zuks](https://github.com/kasparsz).
Released under the [MIT license](https://github.com/kasparsz/ease-value/blob/master/LICENSE).

[npm-url]: https://npmjs.org/package/ease-value
[npm-image]: http://img.shields.io/npm/v/ease-value.svg
[travis-url]: https://travis-ci.org/kasparsz/ease-value
[travis-image]: http://img.shields.io/travis/kasparsz/ease-value.svg
