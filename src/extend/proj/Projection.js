// @flow

import CoordTransform, {transform} from './CoordTransform';

import {getHeight, getWidth} from '../extent';
import {register} from '../../util/web_worker_transfer';

import {deepCopy, findLastIndexOf} from '../util/util';

export type ProjectionOption = {
    code: string,
    units: any,
    extent: [number, number, number, number],
    resolutions?: Array<number>,
    tileSize?: number,
    validlatRange?: Array<number>
}

/**
 * @description 投影坐标系，用于计算地图瓦片和进行坐标转换的类
 */
class Projection {
    code_: string;
    units_: any;
    extent_: [number, number, number, number];
    resolutions_: any;
    tileSize_: number;
    validlatRange_: Array<number>

    // 计算属性部分
    maxExtent_: number | null;
    transform_: CoordTransform | null;

    // 源坐标系code
    originCode: ?string;

    constructor(options: ProjectionOption) {
        options = deepCopy(options);

        this.code_ = options.code;
        this.units_ = options.units;
        this.extent_ = options.extent;
        this.resolutions_ = options.resolutions;
        this.tileSize_ = options.tileSize || 512;
        this.validlatRange_ = options.validlatRange || [options.extent[1], options.extent[3]];

        this.maxExtent_ = null;
        this.transform_ = null;
    }

    get minZoom() {
        if (this.resolutions_) {
            return this.resolutions_.findIndex(r => r !== null);
        }
        return null;
    }

    get maxZoom() {
        if (this.resolutions_) {
            return findLastIndexOf(this.resolutions_, r => r != null);
        }
        return null;
    }

    /**
     * 获取坐标转换方法
     * @returns 坐标转换方法
     */
    getTransform(): CoordTransform {
        // 默认坐标系（混合坐标系）
        if (this.code_ === 'EPSG:mapbox' || this.originCode === 'EPSG:mapbox') {
            return transform;
        }

        // 其他坐标系
        if (!this.transform_) {
            this.transform_ = new CoordTransform(this);
        }
        return this.transform_;
    }

    getCode(): string {
        return this.code_;
    }

    getUnits(): any {
        return this.units_;
    }

    getExtent(): [number, number, number, number] {
        return [...this.extent_];
    }

    getResolutions(): Array<number> | null {
        if (this.resolutions_) {
            return [...this.resolutions_];
        }
        return null;
    }

    getTileSize(): number {
        return this.tileSize_;
    }

    getValidlatRange(): Array<number> {
        return [...this.validlatRange_];
    }

    getMaxExtent(): number {
        if (!this.maxExtent_) {
            this.maxExtent_ = Math.max(getHeight(this.extent_), getWidth(this.extent_));
        }
        return this.maxExtent_;
    }

    setResolutions(resolutions: Array<number>) {
        this.resolutions_ = [...resolutions];
    }

    setTileSize(tileSize: number) {
        this.tileSize_ = tileSize;
    }

    setValidlatRange(validlatRange: Array<number>) {
        this.validlatRange_ = [...validlatRange];
    }

    clone(): Projection {
        const proj = new Projection({
            code: this.code_,
            units: this.units_,
            extent: this.extent_,
            resolutions: this.resolutions_,
            tileSize: this.tileSize_,
            validlatRange: this.validlatRange_
        });
        proj.originCode = this.originCode;

        return proj;
    }

    /**
     * 获取zoom下的resolution
     *
     * @param zoom 缩放级别
     * @returns 地图解析度
     */
    getZoomResolution(zoom: number): number {
        if (this.resolutions_) {
            const floorResolution = this.resolutions_[Math.floor(zoom)];
            const ceilResolution = this.resolutions_[Math.ceil(zoom)];

            // 到达最小
            if (!floorResolution) { return this.resolutions_[this.minZoom]; }
            // 到达最大
            if (!ceilResolution) { return this.resolutions_[this.maxZoom]; }

            // 中间值，取线性百分比
            return floorResolution + (zoom - Math.floor(zoom)) * (ceilResolution - floorResolution);
        }

        // 默认
        return this.getMaxExtent() / (this.tileSize_ * Math.pow(2, zoom));
    }

    /**
     * 获取zoom下存在的瓦片数量
     *
     * @param zoom 缩放级别
     * @returns 地图像素值
     */
    zoomScale(zoom: number): number {
        if (this.resolutions_) {
            return this.getMaxExtent() / this.getZoomResolution(zoom) / this.tileSize_;
        }
        return Math.pow(2, zoom);
    }

    /**
     * 获取指定数量下的zoom级别
     *
     * @param scale 像素值
     * @returns 缩放
     */
    scaleZoom(scale: number): number {
        // if (this.resolutions_) {
        //     const resolution = this.getMaxExtent() / (scale * this.tileSize_);
        //     if (resolution >= this.resolutions_[this.minZoom]) {
        //         return this.minZoom;
        //     }
        //     if (resolution <= this.resolutions_[this.maxZoom]) {
        //         return this.maxZoom;
        //     }

        //     // resolution从大到小，取的第一个小于当前resolution的值
        //     const baseZoom = this.resolutions_.findIndex(r => r && r <= resolution);

        //     // 取线性关系值
        //     const preResolution = this.resolutions_[baseZoom - 1];
        //     if (preResolution) {
        //         return baseZoom - 1 + (resolution - preResolution) / (this.resolutions_[baseZoom] - preResolution);
        //     }
        //     return baseZoom;
        // }
        return Math.log(scale) / Math.LN2;
    }
}

// web_worker序列化支持
register('Projection', Projection, {omit: ['maxExtent_', 'transform_']});

export default Projection;
