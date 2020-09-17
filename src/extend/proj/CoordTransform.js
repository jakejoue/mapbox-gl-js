// @flow
import { getTileBBox } from "@mapbox/whoots-js";

import Projection from "./Projection";
import Units from "./Units";

// mapbox默认转换方法
const circumferenceAtEquator = 2 * Math.PI * 6378137;

function circumferenceAtLatitude(latitude: number) {
    return circumferenceAtEquator * Math.cos((latitude * Math.PI) / 180);
}

function mercatorXfromLng(lng: number) {
    return (180 + lng) / 360;
}

function mercatorYfromLat(lat: number) {
    return (
        (180 -
            (180 / Math.PI) *
                Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))) /
        360
    );
}

function mercatorZfromAltitude(altitude: number, lat: number) {
    return altitude / circumferenceAtLatitude(lat);
}

function lngFromMercatorX(x: number) {
    return x * 360 - 180;
}

function latFromMercatorY(y: number) {
    const y2 = 180 - y * 360;
    return (360 / Math.PI) * Math.atan(Math.exp((y2 * Math.PI) / 180)) - 90;
}

function altitudeFromMercatorZ(z: number, y: number) {
    return z * circumferenceAtLatitude(latFromMercatorY(y));
}

function mercatorScale(lat: number) {
    return 1 / Math.cos((lat * Math.PI) / 180);
}

// 默认转换方法
const baseTransform = {
    // 一些静态变量
    maxExtent: 360,
    minX: -180,
    minY: -85,
    maxX: 180,
    maxY: 85,
    // 方法
    circumferenceAtLatitude,
    mercatorXfromLng,
    mercatorYfromLat,
    mercatorZfromAltitude,
    lngFromMercatorX,
    latFromMercatorY,
    altitudeFromMercatorZ,
    mercatorScale,
    getTileBBox,
};

const transform = ((baseTransform: any): CoordTransform);

export { transform };

/**
 * @description 坐标转换类
 */
class CoordTransform {
    projection: any;
    maxExtent: any;
    minX: any;
    minY: any;
    maxX: any;
    maxY: any;
    units: any;

    constructor(projection: Projection) {
        this.projection = projection;

        const maxExtent = projection.getMaxExtent();
        const [minX, minY, maxX, maxY] = projection.getExtent();

        this.maxExtent = maxExtent;
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;

        this.units = projection.getUnits();
    }

    /**
     * 计算指定高程下的地图范围
     * @param {number} latitude
     */
    circumferenceAtLatitude(latitude: number) {
        if (this.units === Units.DEGREES) {
            return (
                circumferenceAtEquator * Math.cos((latitude * Math.PI) / 180)
            );
        }
        return this.maxExtent;
    }

    /**
     * 地图经度转墨卡托经度
     * @param {number} lng
     */
    mercatorXfromLng(lng: number) {
        return (lng - this.minX) / this.maxExtent;
    }

    /**
     * 地图纬度转墨卡托纬度
     * @param {number} lat
     */
    mercatorYfromLat(lat: number) {
        return (this.maxY - lat) / this.maxExtent;
    }

    /**
     * 指定纬度下的高程计算
     * @param {number} altitude
     * @param {number} lat
     */
    mercatorZfromAltitude(altitude: number, lat: number) {
        return altitude / this.circumferenceAtLatitude(lat);
    }

    /**
     * 墨卡托经度转为地图经度
     * @param {number} x
     */
    lngFromMercatorX(x: number) {
        return x * this.maxExtent + this.minX;
    }

    /**
     * 墨卡托纬度转为地图纬度
     * @param {number} y
     */
    latFromMercatorY(y: number) {
        return this.maxY - y * this.maxExtent;
    }

    altitudeFromMercatorZ(z: number, y: number) {
        return z * this.circumferenceAtLatitude(this.latFromMercatorY(y));
    }

    mercatorScale(lat: number) {
        if (this.units === Units.DEGREES) {
            return 1 / Math.cos((lat * Math.PI) / 180);
        }
        return 1 / lat;
    }

    /**
     * 获取指定瓦片的坐标范围
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    getTileBBox(x: number, y: number, z: number): string {
        const worldSize = this.projection.zoomScale(z);

        const minX = this.lngFromMercatorX(x / worldSize);
        const maxX = this.lngFromMercatorX((x + 1) / worldSize);
        const maxY = this.latFromMercatorY(y / worldSize);
        const minY = this.latFromMercatorY((y + 1) / worldSize);

        return [minX, minY, maxX, maxY].join(",");
    }
}

export default CoordTransform;
