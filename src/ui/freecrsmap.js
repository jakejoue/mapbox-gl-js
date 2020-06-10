// @flow
import Map from './map';
import { get, Projection } from '../extend/proj';
// GeoGlobal-tileSize-huangwei-191113
import window from '../util/browser/window';

/**
 * @description 用于兼容GeoGlobeAPI的类
 */
export default class FreeCRSMap extends Map {
    _mapCRS: any;
    units: any;

    constructor(options: any) {
        let mapCRS = options.mapCRS,
            units = options.units || 'degrees';

        // 删除投影设置
        delete options.projection;

        if (mapCRS) {
            if (typeof (mapCRS) !== 'object') {
                // 支持代号
                options.projection = get(mapCRS);
            } else {
                // 通过对象构建坐标系
                const { topTileExtent, resolutions, tileSize, units: crsUnits2 } = mapCRS;
                options.projection = new Projection({
                    code: 'mapcrs',
                    units: crsUnits2 || units,
                    extent: topTileExtent || [-180, -90, 180, 90],
                    resolutions,
                    // GeoGlobal-tileSize-huangwei-191113
                    tileSize: tileSize || window.GEOGLOBE_TILESIZE || 512
                });
            }
        }

        // 构建完整的mapCrs
        if (options.projection) {
            const projection = options.projection;

            mapCRS = {
                units: projection.getUnits(),
                topTileExtent: projection.getExtent(),
                resolutions: projection.getResolutions(),
                tileSize: projection.getTileSize()
            };
            units = projection.getUnits();
        }

        super(options);

        this._mapCRS = mapCRS;
        this.units = units;
    }

    get _tileExtent() {
        if (this.projection.getCode() === 'EPSG:mapbox' || this.projection.originCode === 'EPSG:mapbox') {
            return [-20037508.3427892, -20037508.3427892, 20037508.3427892, 20037508.3427892];
        } else {
            return this.projection.getExtent();
        }
    }
}
