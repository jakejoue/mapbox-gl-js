// @flow
import window from '../util/browser/window';

import Map from './map';
import { Projection } from '../extend/proj';

/**
 * @description 用于兼容GeoGlobeAPI的类
 */
export default class FreeCRSMap extends Map {
    constructor(options) {
        const mapCRS = options.mapCRS;
        if (mapCRS) {
            const units = options.units;
            const { topTileExtent, resolutions, tileSize } = mapCRS;
            const projection = new Projection({
                code: 'mapcrs',
                units: units || 'degrees',
                extent: topTileExtent || [-180, -90, 180, 90],
                resolutions,
                tileSize: tileSize || window.GEOGLOBE_TILESIZE || 256
            });
            options.projection = projection;
        }
        super(options);
        this._mapCRS = mapCRS;
    }

    get _tileExtent() {
        if (this.projection.getCode() === 'EPSG:mapbox') {
            return [-20037508.3427892, -20037508.3427892, 20037508.3427892, 20037508.3427892];
        } else {
            return this.projection.getExtent();
        }
    }
}
