// @flow

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
                extent: topTileExtent,
                resolutions,
                tileSize: tileSize || global.GEOGLOBE_TILESIZE || 256
            });
            options.projection = projection;
        }
        super(options);
        this._mapCRS = mapCRS;
    }
}
