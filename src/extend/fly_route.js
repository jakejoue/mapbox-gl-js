// @flow
import { clamp } from '../util/util';
import browser from '../util/browser';
import TaskQueue from '../util/task_queue';

import type Map from '../ui/map';
import type { Cancelable } from '../types/cancelable';
import type { TaskID } from '../util/task_queue';

// 一些工具方法
const util = {
    length(coord1, coord2): number {
        return Math.sqrt(
            Math.pow(coord2[0] - coord1[0], 2),
            Math.pow(coord2[1] - coord1[1], 2)
        );
    },
    lengthArray(coords: Array): number {
        let l = 0;
        coords.reduce((pre, next) => {
            l += this.length(pre, next);
            return next;
        });
        return l;
    },
    calcDirection(coord1: Array, coord2: Array): number {
        if (coord1 && coord2) {
            const angle = Math.atan2(coord2[1] - coord1[1], coord2[0] - coord1[0]);
            return 90 - angle / Math.PI * 180;
        }
    },
    scalePoint(scale: number, coord1: Array, coord2: Array): Array {
        scale = this.clamp(scale, 0, 1);
        return coord1.map((c, i) => c + (coord2[i] - c) * scale);
    }
};

// 路径计算控制器
class PosControl {
    // 常量
    PATH: Array; // 完整的路径
    LENGTH: number; // 全部的长度
    ZOOMRANGE: [number, number]; // 缩放范围
    MIN_Z: number;
    MAX_Z: number;

    // 变量（可外部改变部分）
    speed: number; // 速度
    // 非外部改变部分
    preIndex: number; // 上个点的索引
    currentPoint: Array; // 当前点坐标
    passLength: number; // 已经经过的点的长度，用于百分比的计算

    constructor(path, speedV, zoomRange) {
        this.PATH = path;
        this.LENGTH = util.lengthArray(path);
        this.ZOOMRANGE = zoomRange;

        const zs = path.map(c => c[2]).filter(v => typeof v === 'number');
        this.MIN_Z = Math.min(...zs);
        this.MAX_Z = Math.max(...zs);

        this.speed = speedV;
        this.preIndex = 0;
        this.currentPoint = path[0];
        this.passLength = 0;
    }

    // 速度
    getSpeed(): number {
        return this.speed;
    }
    setSpeed(value: number) {
        this.speed = value;
    }
    // 百分比
    getPercent(): number {
        return clamp(this.passLength / this.LENGTH, 0, 1) * 100;
    }
    setPercent(value: number) {
        const percent = clamp(value, 0, 100) / 100;

        this.passLength = 0;
        this.calcNextPoint(percent * this.LENGTH, {
            index: 1,
            cPoint: this.PATH[0]
        });
    }
    /**
     * 获取已经通过的线段信息
     */
    getPathLine(): Array {
        const path = this.PATH.slice(0, this.preIndex + 2);
        path.pop();
        return [...path, [...this.currentPoint]];
    }
    /**
     * @api
     * 获取当前点
     */
    getCurrentPoint(): Array {
        return [...this.currentPoint];
    }
    /**
     * @api
     * 获取方位信息
     */
    getDirection(): number {
        return util.calcDirection(this.currentPoint, this.PATH[this.preIndex + 1]);
    }
    /**
     * @api
     * 获取当前缩放
     */
    getZoom(cPoint = this.currentPoint): number {
        const currentZ = cPoint[2];
        if (currentZ && this.ZOOMRANGE) {
            return (
                this.ZOOMRANGE[0] +
                ((currentZ - this.MIN_Z) / (this.MAX_Z - this.MIN_Z)) *
                (this.ZOOMRANGE[1] - this.ZOOMRANGE[0])
            );
        }
    }
    /**
     * @api
     * 计算下一个点
     * @param {number} distance 距离下一个点的距离
     * @param {number} index 上个点的索引
     * @param {boolean} update 是否自动更新已经通过路径长度
     */
    calcNextPoint(
        distance = this.speed,
        { index = this.preIndex + 1, cPoint = this.currentPoint } = {}
    ): void {
        let resultPoint;

        // 默认加距离
        this.passLength += distance;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const nextPoint = this.PATH[index];
            // 如果存在下个点
            if (nextPoint) {
                const dis = util.length(cPoint, nextPoint);
                // 目标点在指定两点中间
                if (dis >= distance) {
                    resultPoint = util.scalePoint(
                        distance / dis,
                        cPoint,
                        nextPoint
                    );
                    break;
                } else {
                    // 目标点不在指定两点中间
                    distance -= dis;
                    cPoint = nextPoint;
                    index++;

                    // 旋转回调
                    if (this.rotateCallback) {
                        this.rotateCallback(
                            cPoint,
                            util.calcDirection(cPoint, this.PATH[index])
                        );
                    }
                }
            } else {
                // 如果不存在下个点，认为到达线段结尾
                index = this.PATH.length;
                this.passLength = this.LENGTH;
                resultPoint = this.PATH[index - 1];
                break;
            }
        }
        // 设置上个点索引
        this.preIndex = index - 1;
        // 设置当前点
        this.currentPoint = resultPoint;
    }
}

// 常量，每米代表的经纬度距离
const SPEED = 0.000008983152841195214;

export default class FlyRoute {
    // 地图对象
    _map: Map;

    // 当前的动画对象
    _frame: Cancelable;

    // 渲染进程
    _renderTaskQueue: TaskQueue;

    // 当前播放状态(0停止 1播放)
    _status: number;

    // 外部更新方法
    update: function;

    constructor(path, zoomRange) {
        // 路径有效性判断
        if (!path || path.length <= 1) {
            throw new Error('flyroute: 无效的飞行轨迹！');
        }

        // 缩放范围判断
        if (zoomRange) {
            const [min, max] = zoomRange;
            if (!min || !max || min >= max) {
                throw new Error('无效的zoomRange！');
            }
        }

        // 初始化成员变量
        this._status = 0;
        this._renderTaskQueue = new TaskQueue();

        // 更新函数
        this._rotate = FlyRoute.rotateHandler.bind(this);

        // 控制器
        this._control = new PosControl(
            [...path],
            SPEED,
            [...zoomRange],
            this._rotate
        );
    }

    // 速度（整数）
    get Speed(): number {
        return Math.round(this._control.getSpeed() / SPEED);
    }
    set Speed(value: number) {
        value = Math.max(0, value);
        this._control.setSpeed(Math.round(value) * SPEED);
    }

    // 百分比
    get Percent(): number {
        return this._control.getPercent();
    }
    set Percent(value: number) {
        this._control.setPercent(value);
    }

    // 获取已经通过的点
    get PathLine(): Array {
        return this._control.getPathLine();
    }

    addTo(map: Map) {
        this._map = map;
        return this;
    }

    remove() {
        this.stop();
        this._renderTaskQueue.clear();
        delete this._update;
        delete this._control;
        delete this._map;
        delete this.update;
    }

    play() {
        this._status = 1;
        this._update();
        return this;
    }

    stop() {
        this._status = 0;
        if (this._frame) {
            this._frame.cancel();
            this._frame = null;
        }
        return this;
    }

    // 静态更新函数（非直接调用）
    static updateHandler() {
        if (this._status === 0 || this._frame) {
            return;
        }

        const control = this._control;
        const map = this._map;

        this._frame = requestAnimationFrame(() => {
            // 删除frameid（过滤动画请求）
            delete this._frame;

            if (control.getPercent() < 100) {
                // 计算下个点
                control.calcNextPoint();

                const options = {
                    center: control.getCurrentPoint(),
                    bearing: control.getDirection(),
                    zoom: control.getZoom()
                };
                // 删除无效属性
                Object.keys(options).forEach(k => {
                    if (options[k] === undefined) {
                        delete options[k];
                    }
                });

                const next = () => {
                    // 如果是在旋转中
                    if (this.isRotating) {
                        setTimeout(next, 500);
                        return;
                    }

                    // 存在map的时候进行更新
                    if (map) map.jumpTo(options);

                    // 存在外部更新方法
                    if (this.update) this.update(options.center, this);

                    // 进行下次更新
                    this._update();
                };
                next();
            } else {
                this.stop();
            }
        });
    }

    static rotateHandler(point: Array, bearing: number) {
        this.isRotating = true;

        const map = this._map;

        // 存在map的时候进行更新
        if (map) map.jumpTo({ center: point });

        // 存在外部更新方法
        if (this.update) this.update(point, this);

        // 旋转
        if (map && bearing) {
            // 两秒后不管怎样都完成旋转
            setTimeout(() => {
                if (this.isRotating) {
                    this.isRotating = false;
                }
            }, 2000);

            // 禁用鼠标操作
            map.easeTo({
                bearing,
                duration: 2000,
                easing: v => {
                    if (v === 1) {
                        this.isRotating = false;
                    }
                    return v;
                }
            });
        } else {
            this.isRotating = false;
        }
    }

    /**
     * @private
     * 帧函数
     */
    _requestRenderFrame(callback: () => void): TaskID {
        this._update();
        return this._renderTaskQueue.add(callback);
    }

    /**
     * @private
     * 移除指定帧
     */
    _cancelRenderFrame(id: TaskID) {
        this._renderTaskQueue.remove(id);
    }

    _update() {
        if (!this._frame) {
            this._frame = browser.frame(() => {
                this._frame = null;
                this._render();
            });
        }
    }

    _render() {
        this._renderTaskQueue.run();
    }
}
