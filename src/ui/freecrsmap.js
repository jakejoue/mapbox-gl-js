// @flow
import Map from './map';
import { get, Projection } from '../extend/proj';

/**
 * @description 用于兼容GeoGlobeAPI的类
 */
export default class FreeCRSMap extends Map {
    _mapCRS: any;
    units: any;

    constructor(options: any) {
        let mapCRS = options.mapCRS,
            units = options.units || 'degrees';

        if (mapCRS) {
            const { topTileExtent, resolutions, tileSize, units: crsUnits2 } = mapCRS;
            const projection = new Projection({
                code: 'mapcrs',
                units: crsUnits2 || options.units,
                extent: topTileExtent || [-180, -90, 180, 90],
                resolutions,
                tileSize
            });
            options.projection = projection;
        } else {
            // 如果传递的是自定义坐标系，构造mapCRS
            const projection = get(options.projection);

            if (projection && projection.getCode() !== 'EPSG:mapbox') {
                mapCRS = {
                    units: projection.getUnits(),
                    topTileExtent: projection.getExtent(),
                    resolutions: projection.getResolutions(),
                    tileSize: projection.getTileSize()
                };
                units = projection.getUnits();
            }
        }
        super(options);

        this._mapCRS = mapCRS;
        this.units = units;
    }

    get _tileExtent() {
        if (this.projection.getCode() === 'EPSG:mapbox') {
            return [-20037508.3427892, -20037508.3427892, 20037508.3427892, 20037508.3427892];
        } else {
            return this.projection.getExtent();
        }
    }
}
