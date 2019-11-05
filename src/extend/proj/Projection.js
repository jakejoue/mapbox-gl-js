// @flow

import Units from './Units';
import CoordTransform, { transform } from './CoordTransform';

import { getHeight, getWidth } from '../extent';
import { register } from '../../util/web_worker_transfer';

export type ProjectionOption = {
    code: string,
    units: Units,
    extent: Array<number>,
    resolutions?: Array<number>,
    tileSize?: number,
    validlatRange?: Array<number>
}

class Projection {
    code_: string;
    units_: Units;
    extent_: Array<number>;
    resolutions_: Array<number>;
    tileSize_: number;
    validlatRange_: Array<number>

    // 计算属性部分
    maxExtent_: number;
    transform_: CoordTransform;

    constructor(options: ProjectionOption) {
        this.code_ = options.code;
        this.units_ = options.units;
        this.extent_ = options.extent;
        this.resolutions_ = options.resolutions;
        this.tileSize_ = options.tileSize || 512;
        this.validlatRange_ = options.validlatRange || [options.extent[1], options.extent[3]];

        this.maxExtent_ = null;
        this.transform_ = null;
    }

    /**
     * 获取坐标转换方法
     */
    getTransform(): CoordTransform {
        // 默认坐标系（混合坐标系）
        if (this.code_ === 'EPSG:mapbox') {
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

    getExtent(): Array<number> {
        return [...this.extent_];
    }

    getUnits(): Units {
        return this.units_;
    }

    getTileSize(): number {
        return this.tileSize_;
    }

    getValidlatRange(): Array<number> {
        return this.validlatRange_;
    }

    getMaxExtent(): number {
        if (!this.maxExtent_) {
            this.maxExtent_ = Math.max(getHeight(this.extent_), getWidth(this.extent_));
        }
        return this.maxExtent_;
    }

    setResolutions(resolutions: Array<number>) {
        this.resolutions_ = resolutions;
    }

    setTileSize(tileSize: number) {
        this.tileSize_ = tileSize;
    }

    clone(): Projection {
        return new Projection({
            code: this.code_,
            units: this.units_,
            extent: this.extent_,
            resolutions: this.resolutions_,
            tileSize: this.tileSize_,
            validlatRange: this.validlatRange_
        });
    }

    /**
     * 获取zoom下的resolution
     */
    getZoomResolution(zoom: number): number {
        if (this.resolutions_) {
            const floorResolution = this.resolutions_[Math.floor(zoom)];
            const roundResolution = this.resolutions_[Math.round(zoom)];

            // 到达最小
            if (!floorResolution) { return this.resolutions_[0]; }
            // 到达最大
            if (!roundResolution) { return this.resolutions_[this.resolutions_.length - 1]; }

            // 中间值，取线性百分比
            return floorResolution + (zoom - Math.floor(zoom)) * (roundResolution - floorResolution);
        }

        // 默认
        return this.maxExtent / (this.tileSize_ * Math.pow(2, zoom));
    }

    /**
     * 获取zoom下存在的瓦片数量
     */
    zoomScale(zoom: number): number {
        if (this.resolutions_) {
            return this.maxExtent / this.getZoomResolution(zoom) / this.tileSize_;
        }
        return Math.pow(2, zoom);
    }

    /**
     * 获取指定数量下的zoom级别
     */
    scaleZoom(scale: number): number {
        if (this.resolutions_) {
            const resolution = this.maxExtent / (scale * this.tileSize_);
            if (resolution >= this.resolutions_[0]) {
                return 0;
            }
            if (resolution <= this.resolutions_[this.resolutions_.length - 1]) {
                return this.resolutions_.length - 1;
            }

            // resolution从大到小，取的第一个小于当前resolution的值
            const baseZoom = this.resolutions_.findIndex(r => r <= resolution);

            // 取线性关系值
            const preResolution = this.resolutions_[baseZoom - 1];
            if (preResolution) {
                return baseZoom - 1 + (resolution - preResolution) / (this.resolutions_[baseZoom] - preResolution);
            }
            return baseZoom;
        }
        return Math.log(scale) / Math.LN2;
    }
}

// web_worker序列化支持
register('Projection', Projection, { omit: ['maxExtent_', 'transform_'] });

export default Projection;
