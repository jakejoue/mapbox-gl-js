// @flow

import Units from './Units.js';
import { getHeight, getWidth } from '../extent';

type ProjectionOption = {
    code: string,
    units: Units,
    extent: Array<number>,
    resolutions?: Array<number>,
    tileSize?: number
}

class Projection {
    code_: string;
    units_: Units;
    extent_: Array<number>;
    resolutions_: Array<number>;
    tileSize_: number;
    maxExtent_: number;

    constructor(options: ProjectionOption) {
        this.code_ = options.code;
        this.units_ = options.units;
        this.extent_ = options.extent;
        this.resolutions_ = options.resolutions;
        this.tileSize_ = options.tileSize || 512;

        this.maxExtent_ = Math.max(getHeight(this.extent_), getWidth(this.extent_));
    }

    getCode(): string {
        return this.code_;
    }

    getExtent(): Array<number> {
        return this.extent_;
    }

    getUnits(): Units {
        return this.units_;
    }

    getTileSize(): number {
        return this.tileSize_;
    }

    getMaxExtent(): number {
        return this.maxExtent_;
    }

    setTileSize(tileSize: number) {
        this.tileSize_ = tileSize;
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

export default Projection;
