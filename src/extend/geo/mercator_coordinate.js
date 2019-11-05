// @flow

import LngLat from '../geo/lng_lat';
import type { LngLatLike } from '../geo/lng_lat';
import Projection from '../proj/Projection';

const circumferenceAtEquator = 2 * Math.PI * 6378137;

class MercatorCoordinate {
    x: number;
    y: number;
    z: number;
    projection: Projection;

    constructor(x: number, y: number, z: number = 0, projection: Projection) {
        this.x = +x;
        this.y = +y;
        this.z = +z;
        this.projection = projection;
    }

    static fromLngLat(lngLatLike: LngLatLike, altitude: number = 0, projection: Projection) {
        const lngLat = LngLat.convert(lngLatLike);

        return new MercatorCoordinate(
            projection.getTransform().mercatorXfromLng(lngLat.lng),
            projection.getTransform().mercatorYfromLat(lngLat.lat),
            projection.getTransform().mercatorZfromAltitude(altitude, lngLat.lat),
            projection);
    }

    toLngLat() {
        return new LngLat(
            this.projection.getTransform().lngFromMercatorX(this.x),
            this.projection.getTransform().latFromMercatorY(this.y));
    }

    toAltitude() {
        return this.projection.getTransform().altitudeFromMercatorZ(this.z, this.y);
    }

    meterInMercatorCoordinateUnits() {
        // 1 meter / circumference at equator in meters * Mercator projection scale factor at this latitude
        return 1 / circumferenceAtEquator * this.projection.getTransform().mercatorScale(this.projection.getTransform().latFromMercatorY(this.y));
    }

}

export default MercatorCoordinate;
