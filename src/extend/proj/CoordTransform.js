// @flow
import { getTileBBox } from '@mapbox/whoots-js';

import Projection from './Projection';
import Units from './Units';

// mapbox默认转换方法
const circumferenceAtEquator = 2 * Math.PI * 6378137;

function circumferenceAtLatitude(latitude: number) {
    return circumferenceAtEquator * Math.cos(latitude * Math.PI / 180);
}

function mercatorXfromLng(lng: number) {
    return (180 + lng) / 360;
}

function mercatorYfromLat(lat: number) {
    return (180 - (180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)))) / 360;
}

function mercatorZfromAltitude(altitude: number, lat: number) {
    return altitude / circumferenceAtLatitude(lat);
}

function lngFromMercatorX(x: number) {
    return x * 360 - 180;
}

function latFromMercatorY(y: number) {
    const y2 = 180 - y * 360;
    return 360 / Math.PI * Math.atan(Math.exp(y2 * Math.PI / 180)) - 90;
}

function altitudeFromMercatorZ(z: number, y: number) {
    return z * circumferenceAtLatitude(latFromMercatorY(y));
}

function mercatorScale(lat: number) {
    return 1 / Math.cos(lat * Math.PI / 180);
}

// 默认转换方法
const transform = {
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
    getTileBBox
};

export { transform };

class CoordTransform {
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

    circumferenceAtLatitude(latitude: number) {
        if (this.units === Units.DEGREES) {
            return circumferenceAtEquator * Math.cos(latitude * Math.PI / 180);
        }
        return this.maxExtent;
    }

    mercatorXfromLng(lng: number) {
        return (lng - this.minX) / this.maxExtent;
    }

    mercatorYfromLat(lat: number) {
        return (this.maxY - lat) / this.maxExtent;
    }

    mercatorZfromAltitude(altitude: number, lat: number) {
        return altitude / this.circumferenceAtLatitude(lat);
    }

    lngFromMercatorX(x: number) {
        return x * this.maxExtent + this.minX;
    }

    latFromMercatorY(y: number) {
        return this.maxY - y * this.maxExtent;
    }

    altitudeFromMercatorZ(z: number, y: number) {
        return z * this.circumferenceAtLatitude(this.latFromMercatorY(y));
    }

    mercatorScale(lat: number) {
        if (this.units === Units.DEGREES) {
            return 1 / Math.cos(lat * Math.PI / 180);
        }
        return 1 / lat;
    }

    getTileBBox(x, y, z) {
        const zoomScale = this.projection.zoomScale(z);
        y = (zoomScale - y - 1);

        const tileWidth = this.maxX - this.minX;
        const tileHeight = this.maxY - this.minY;

        const minx = this.minX + tileWidth * x / zoomScale;
        const miny = this.minY + tileHeight * y / zoomScale;
        const maxx = this.minY + tileWidth * (x + 1) / zoomScale;
        const maxy = this.minX + tileHeight * (y + 1) / zoomScale;

        return [minx, miny, maxx, maxy].join(',');
    }
}

export default CoordTransform;
