// @flow

import window from '../../util/window';
import browser from '../../util/browser';

/**
 * 用于定时函数，均和请求
 * @param {*} fn 需要均匀的函数
 * @param {*} interval 限制时间
 * @param {*} target 需要附加的对象
 */
export function rateLimit(fn: Function, interval: Number, target: any): Function {
    let preTime = null;

    const proxy = (...rest) => {
        if (!preTime) {
            preTime = browser.now();
            fn.call(target, ...rest);
        } else {
            (function () {
                preTime = browser.now();
                const defTime = browser.now();
                window.setTimeout(() => {
                    if (defTime < preTime) return;
                    fn.call(target, ...rest);
                }, interval);
            })();
        }
    };

    return proxy;
}

/**
 * 判断一个对象是否存在
 * @param {*} object 对象
 */
export function isEmpty(object) {
    let property;
    for (property in object) {
        return false;
    }
    return !property;
}

/**
 * typeOf
 * @param {*} obj
 */
export function typeOf(obj) {
    const toString = Object.prototype.toString;
    const map = {
        '[object Boolean]': 'boolean',
        '[object Number]': 'number',
        '[object String]': 'string',
        '[object Function]': 'function',
        '[object Array]': 'array',
        '[object Date]': 'date',
        '[object RegExp]': 'regExp',
        '[object Undefined]': 'undefined',
        '[object Null]': 'null',
        '[object Object]': 'object'
    };
    return map[toString.call(obj)];
}

/**
 * 对象深赋值
 * @param {Object} data
 */
export function deepCopy(
    data,
    { valueProcessors = [], keyProcessors = [], ignores = [] } = {}
) {
    const t = typeOf(data);
    let o;

    if (t === 'array') {
        o = [];
    } else if (t === 'object') {
        o = {};
    } else {
        return data;
    }

    if (t === 'array') {
        for (let i = 0; i < data.length; i++) {
            o.push(
                deepCopy(data[i], {
                    keyProcessors,
                    valueProcessors,
                    ignores
                })
            );
        }
    } else if (t === 'object') {
        for (const i in data) {
            // ignores
            if (ignores.indexOf(i) !== -1) {
                o[i] = data[i];
                continue;
            }
            // key
            let key = i;
            keyProcessors.forEach(processor => {
                key = processor(key);
            });
            // data
            let _data = data[i];
            valueProcessors.forEach(processor => {
                _data = processor(_data, key);
            });
            // 已经处理过的数据，不再copy
            o[key] =
                _data === data[i] ?
                    deepCopy(_data, {
                        keyProcessors,
                        valueProcessors,
                        ignores
                    }) :
                    _data;
        }
    }
    return o;
}

/**
 * 末端查找
 * @param {*} array 原数组
 * @param {*} fn 方法
 */
export function findLastIndexOf(array, fn) {
    for (let i = array.length - 1; i >= 0; i--) {
        const element = array[i];
        if (fn(element, i, array)) {
            return i;
        }
    }
    return -1;
}
