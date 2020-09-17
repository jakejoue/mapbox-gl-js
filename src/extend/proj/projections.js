// @flow

// 全局变量存储
let cache = {};

// 清空坐标系
export function clear() {
    cache = {};
}

// 通过code获取坐标系
export function get(code: string) {
    return cache[code] || null;
}

// 添加坐标系
export function add(code: string, projection: any) {
    cache[code] = projection;
}
