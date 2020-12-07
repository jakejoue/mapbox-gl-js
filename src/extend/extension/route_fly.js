/* eslint-disable flowtype/require-valid-file-annotation */

import {clamp} from "../../util/util";
import {number as interpolate} from "../../style-spec/util/interpolate";
import {METERS_PER_UNIT} from "../proj/Units";
import LngLat from "../geo/lng_lat";

// 一些工具方法
const util = {
    length(coord1, coord2) {
        return Math.sqrt(Math.pow(coord2[0] - coord1[0], 2) + Math.pow(coord2[1] - coord1[1], 2));
    },
    lengthArray(coords) {
        let l = 0;
        coords.reduce((pre, next) => {
            l += this.length(pre, next);
            return next;
        });
        return l;
    },
    calcBearing(coord1, coord2) {
        if (coord1 && coord2) {
            const angle = Math.atan2(
                coord2[1] - coord1[1],
                coord2[0] - coord1[0]
            );
            return 90 - (angle / Math.PI) * 180;
        }
    },
    scalePoint(scale, coord1, coord2) {
        scale = clamp(scale, 0, 1);
        return coord1.map((c, i) => c + (coord2[i] - c) * scale);
    },
};

// 路径计算控制器
class PosControl {
    // // 常量
    // PATH; // 完整的路径
    // LENGTH; // 全部的长度
    // ZOOMRANGE: ?[number, number]; // 缩放范围
    // MIN_Z;
    // MAX_Z;

    // // 变量（可外部改变部分）
    // speed; // 速度
    // // 非外部改变部分
    // preIndex; // 上个点的索引
    // currentPoint; // 当前点坐标
    // passLength; // 已经经过的点的长度，用于百分比的计算

    // // 旋转参数(多个点)
    // rotateOptions;

    constructor(path, speedV, zoomRange) {
        this.PATH = path;
        this.LENGTH = util.lengthArray(path);
        this.ZOOMRANGE = zoomRange;

        const zs = path.map((c) => c[2]).filter((v) => typeof v === "number");
        this.MIN_Z = Math.min(...zs);
        this.MAX_Z = Math.max(...zs);

        this.speed = speedV;
        this.preIndex = 0;
        this.currentPoint = path[0];
        this.passLength = 0;

        this.rotateOptions = [];
    }

    // 速度
    getSpeed() {
        return this.speed;
    }
    setSpeed(value) {
        this.speed = value;
    }
    // 百分比
    getPercent() {
        return clamp(this.passLength / this.LENGTH, 0, 1) * 100;
    }
    setPercent(value) {
        const percent = clamp(value, 0, 100) / 100;

        this.passLength = 0;
        this.calcNextPoint(percent * this.LENGTH, {
            index: 1,
            cPoint: this.PATH[0],
        });
        this.rotateOptions = [];
    }
    // 获取已经通过的线段信息
    getPassLine() {
        const path = this.PATH.slice(0, this.preIndex + 2);
        path.pop();
        return [...path, [...this.currentPoint]];
    }
    // 获取当前点
    getCurrentPoint() {
        return [...this.currentPoint];
    }
    // 获取方位信息
    getBearing() {
        return util.calcBearing(
            this.currentPoint,
            this.PATH[this.preIndex + 1]
        );
    }
    // 获取当前缩放
    getZoom(cPoint = this.currentPoint) {
        const currentZ = cPoint[2];
        if (currentZ && this.ZOOMRANGE) {
            return (
                this.ZOOMRANGE[0] +
                ((currentZ - this.MIN_Z) / (this.MAX_Z - this.MIN_Z)) *
                    (this.ZOOMRANGE[1] - this.ZOOMRANGE[0])
            );
        }
    }
    // 计算下一个点
    calcNextPoint(
        distance = this.speed,
        {index = this.preIndex + 1, cPoint = this.currentPoint} = {}
    ) {
        // 默认加距离
        this.passLength += distance;

        // 重置旋转参数
        this.rotateOptions = [];

        // 结果点
        let resultPoint;

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

                    // 添加旋转点
                    this.rotateOptions.push({
                        point: [...cPoint],
                        bearing: util.calcBearing(cPoint, this.PATH[index]),
                    });
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

/**
 * @description 飞行路径
 */
export default class RouteFly {
    // // 地图对象
    // _map;

    // // 单位
    // _units: String;

    // // 当前播放状态(0停止 1播放)
    // _status;

    // // 当前的动画对象
    // _frameId: ?TaskID;

    // // 位置计算控制器
    // _control: PosControl;

    // // 外部更新方法
    // update: Function;

    constructor(path, zoomRange) {
        // 路径有效性判断
        if (!path || path.length <= 1) {
            throw new Error("flyroute: 无效的飞行轨迹！");
        }

        // 缩放范围判断
        if (zoomRange) {
            const [min, max] = zoomRange;
            if (!min || !max || min >= max) {
                throw new Error("无效的zoomRange！");
            }
        }

        // 坐标单位
        this._units = "degrees";

        // 初始化成员变量
        this._status = 0;

        // 控制器
        this._control = new PosControl([...path], 0, zoomRange);
    }

    // 速度（整数）
    get Speed() {
        return Math.round(
            this._control.getSpeed() / (1 / METERS_PER_UNIT[this._units])
        );
    }
    set Speed(value) {
        value = Math.max(0, value);
        this._control.setSpeed(
            Math.round(value) * (1 / METERS_PER_UNIT[this._units])
        );
    }

    // 百分比
    get Percent() {
        return this._control.getPercent();
    }
    set Percent(value) {
        this._control.setPercent(value);
    }

    // 获取已经通过的点
    get PathLine() {
        return this._control.getPassLine();
    }

    /**
     * @api 添加到地图对象
     * @param map 地图对象
     * @returns {RouteFly} 链式调用
     */
    addTo(map) {
        if (!this._map) {
            this._map = map;
            // 初始化单位和速度
            this._units = map.units || map.projection.getUnits();
            this.Speed = 1;
        }
        return this;
    }

    /**
     * @api
     * 从地图对象中移除
     */
    remove() {
        this.stop();
        delete this.update;
        delete this._control;
        delete this._units;
        delete this._map;
    }

    /**
     * @api
     * 播放函数
     * @returns {RouteFly} 链式调用
     */
    play() {
        this._status = 1;
        this._update();
        return this;
    }

    /**
     * @api
     * 重新播放
     */
    replay() {
        this.stop();
        this._control.setPercent(0);
        this.play();
    }

    /**
     * @api
     * 停止播放
     * @returns {RouteFly} 链式调用
     */
    stop() {
        this._status = 0;
        if (this._frameId) {
            this._map._cancelRenderFrame(this._frameId);
            delete this._frameId;
        }
        return this;
    }

    /**
     * @private
     * 更新函数（地图效果）
     */
    _update() {
        if (!this._frameId) {
            this._frameId = this._map._requestRenderFrame(() => {
                // 删除帧ID
                delete this._frameId;

                // 停止状态
                if (this._status === 0) {
                    return;
                }

                const map = this._map;
                const tr = map.transform;
                const control = this._control;

                // 百分比小于100，即存在可播放
                if (control.getPercent() < 100) {
                    // 计算下个点
                    control.calcNextPoint();

                    // 添加旋转中间帧
                    this._frame(
                        (k, {point, bearing}) => {
                            // 旋转中函数
                            if (k === 0) {
                                tr.center = LngLat.convert(point);
                            }
                            // 更新bearing角度
                            tr.bearing = bearing;
                        },
                        () => {
                            const options = {
                                center: control.getCurrentPoint(),
                                bearing: +control.getBearing(),
                                zoom: +control.getZoom(),
                            };

                            // 缩放
                            if (isFinite(options.zoom)) {
                                tr.zoom = options.zoom;
                            }
                            // 方位
                            if (isFinite(options.bearing)) {
                                tr.bearing = options.bearing;
                            }
                            // 中心点
                            if (options.center) {
                                tr.center = LngLat.convert(options.center);
                            }

                            // 外部更新
                            if (this.update) this.update(options.center, this);

                            // 继续下一帧率
                            this._update();
                        }
                    );
                } else {
                    this.stop();
                }
            });
        }
    }

    /**
     * 过度帧函数
     * @private
     */
    _frame(frame, finish) {
        const map = this._map;
        const control = this._control;
        const rotateOptions = control.rotateOptions || [];

        // 如果存在多个拐点
        if (rotateOptions.length) {
            // 下个旋转点
            const next = () => {
                const rotateOption = rotateOptions.shift();
                let {point, bearing} = rotateOption;

                if (bearing) {
                    const startBearing = map.getBearing();
                    bearing = map._normalizeBearing(bearing, startBearing);
                    const l = Math.floor(Math.abs(bearing - startBearing));

                    let i = 0;
                    // 下个旋转帧
                    const nextFrame = () => {
                        const k = i / l;
                        map._requestRenderFrame(() => {
                            frame(k, {
                                point,
                                bearing: interpolate(startBearing, bearing, k),
                            });

                            // 完成单个拐点
                            if (k >= 1) {
                                if (rotateOptions.length === 0) {
                                    finish();
                                } else {
                                    next();
                                }
                            } else {
                                i++;
                                nextFrame();
                            }
                        });
                    };
                    nextFrame();
                } else {
                    finish(1);
                }
            };
            // 执行函数
            next();
        } else {
            finish(1);
        }
    }
}
