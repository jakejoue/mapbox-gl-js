// @flow

import LngLat, {earthRadius} from '../geo/lng_lat';
import type {LngLatLike} from '../geo/lng_lat';
// GeoGlobal-proj-huangwei
import {Projection} from '../proj';

const earthCircumfrence = 2 * Math.PI * earthRadius; // meters

/**
 * A `MercatorCoordinate` object represents a projected three dimensional position.
 *
 * `MercatorCoordinate` uses the web mercator projection ([EPSG:3857](https://epsg.io/3857)) with slightly different units:
 * - the size of 1 unit is the width of the projected world instead of the "mercator meter"
 * - the origin of the coordinate space is at the north-west corner instead of the middle
 *
 * For example, `MercatorCoordinate(0, 0, 0)` is the north-west corner of the mercator world and
 * `MercatorCoordinate(1, 1, 0)` is the south-east corner. If you are familiar with
 * [vector tiles](https://github.com/mapbox/vector-tile-spec) it may be helpful to think
 * of the coordinate space as the `0/0/0` tile with an extent of `1`.
 *
 * The `z` dimension of `MercatorCoordinate` is conformal. A cube in the mercator coordinate space would be rendered as a cube.
 *
 * @param {number} x The x component of the position.
 * @param {number} y The y component of the position.
 * @param {number} z The z component of the position.
 * @param {Projection} projection The projection component of the position.
 * @example
 * var nullIsland = new mapboxgl.MercatorCoordinate(0.5, 0.5, 0, map.projection);
 *
 * @see [Add a custom style layer](https://www.mapbox.com/mapbox-gl-js/example/custom-style-layer/)
 */
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

    /**
     * Project a `LngLat` to a `MercatorCoordinate`.
     *
     * @param {LngLatLike} lngLatLike The location to project.
     * @param {number} altitude The altitude in meters of the position.
     * @param {Projection} projection The projection to the position.
     * @returns {MercatorCoordinate} The projected mercator coordinate.
     * @example var coord = mapboxgl.MercatorCoordinate.fromLngLat({ lng: 0, lat: 0}, 0, map.projection);
     * coord; // MercatorCoordinate(0.5, 0.5, 0)
     */
    static fromLngLat(lngLatLike: LngLatLike, altitude: number = 0, projection: Projection) {
        const lngLat = LngLat.convert(lngLatLike);

        return new MercatorCoordinate(
            projection.getTransform().mercatorXfromLng(lngLat.lng),
            projection.getTransform().mercatorYfromLat(lngLat.lat),
            projection.getTransform().mercatorZfromAltitude(altitude, lngLat.lat),
            projection);
    }

    /**
     * Returns the `LngLat` for the coordinate.
     *
     * @returns {LngLat} The `LngLat` object.
     * @example
     * var coord = new mapboxgl.MercatorCoordinate(0.5, 0.5, 0, map.projection);
     * var lngLat = coord.toLngLat(); // LngLat(0, 0)
     */
    toLngLat() {
        return new LngLat(
            this.projection.getTransform().lngFromMercatorX(this.x),
            this.projection.getTransform().latFromMercatorY(this.y));
    }

    /**
     * Returns the altitude in meters of the coordinate.
     *
     * @returns {number} The altitude in meters.
     * @example
     * var coord = new mapboxgl.MercatorCoordinate(0, 0, 0.02, map.projection);
     * coord.toAltitude(); // 6914.281956295339
     */
    toAltitude() {
        return this.projection.getTransform().altitudeFromMercatorZ(this.z, this.y);
    }

    /**
     * Returns the distance of 1 meter in `MercatorCoordinate` units at this latitude.
     *
     * For coordinates in real world units using meters, this naturally provides the scale
     * to transform into `MercatorCoordinate`s.
     *
     * @returns {number} Distance of 1 meter in `MercatorCoordinate` units.
     */
    meterInMercatorCoordinateUnits() {
        return 1 / earthCircumfrence * this.projection.getTransform().mercatorScale(this.projection.getTransform().latFromMercatorY(this.y));
    }

}

export default MercatorCoordinate;
