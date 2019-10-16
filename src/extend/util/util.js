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
