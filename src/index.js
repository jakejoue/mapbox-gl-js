// @flow

import assert from 'assert';
import supported from '@mapbox/mapbox-gl-supported';

import { version } from '../package.json';
import Map from './ui/map';
import NavigationControl from './ui/control/navigation_control';
import GeolocateControl from './ui/control/geolocate_control';
import AttributionControl from './ui/control/attribution_control';
import ScaleControl from './ui/control/scale_control';
import FullscreenControl from './ui/control/fullscreen_control';
import Popup from './ui/popup';
import Marker from './ui/marker';
import Style from './style/style';
import LngLat from './extend/geo/lng_lat';
import LngLatBounds from './extend/geo/lng_lat_bounds';
import Point from '@mapbox/point-geometry';
import MercatorCoordinate from './extend/geo/mercator_coordinate';
import {Evented} from './util/evented';
import config from './util/config';
import {setRTLTextPlugin} from './source/rtl_text_plugin';
import WorkerPool from './util/worker_pool';
import {clearTileCache} from './util/tile_request_cache';

// GeoGlobal-proj-huangwei-191015 引用坐标系相关
import * as proj from './extend/proj';
import * as extent from './extend/extent';

// GeoGlobal-layergroup-huangwei-191118 导入图层组相关
import LayerGroup from './extend/extension/layer_group';
// GeoGlobal-routefly-huangwei-191209 分析路径
import RouteFly from './extend/extension/route_fly';
// GeoGlobal-boxhandler-huangwei-191122 框选
import BoxHandler from './extend/extension/box';
// GeoGlobal-util-huangwei-191122 工具类
import * as util from './util/util';

// GeoGlobal-freeCrsMap-huangwei-191121 freeCrsMap
import FreeCRSMap from './ui/freecrsmap';

// GeoGlobal-customLayer-huangwei-200511 CustomLayer
import CustomLayer from './extend/layer/custom_layer';
import RadarLayer from './extend/layer/radar_layer';
import ShieldLayer from './extend/layer/shield_layer';
import ImageCircle from './extend/layer/image_circle_layer';

const exported = {
    version,
    supported,
    setRTLTextPlugin,
    Map,
    NavigationControl,
    GeolocateControl,
    AttributionControl,
    ScaleControl,
    FullscreenControl,
    Popup,
    Marker,
    Style,
    LngLat,
    LngLatBounds,
    Point,
    MercatorCoordinate,
    Evented,
    config,

    // GeoGlobal-proj-huangwei-191015 proj 导入坐标系相关
    proj,
    extent,

    // GeoGlobal-layergroup-huangwei-191118 图层组
    LayerGroup,
    // GeoGlobal-routefly-huangwei-191209 分析路径
    RouteFly,
    // GeoGlobal-boxhandler-huangwei-191122 框选
    BoxHandler,
    // GeoGlobal-util-huangwei-191122 工具类
    util,

    // GeoGlobal-freeCrsMap-huangwei-191121 freeCrsMap
    FreeCRSMap,

    // GeoGlobal-customLayer-huangwei-200511 CustomLayer
    CustomLayer,
    custom: {
        RadarLayer,
        ShieldLayer,
        ImageCircle
    },

    /**
     * Gets and sets the map's [access token](https://www.mapbox.com/help/define-access-token/).
     *
     * @var {string} accessToken
     * @example
     * mapboxgl.accessToken = myAccessToken;
     * @see [Display a map](https://www.mapbox.com/mapbox-gl-js/examples/)
     */
    get accessToken(): ?string {
        return config.ACCESS_TOKEN;
    },

    set accessToken(token: string) {
        config.ACCESS_TOKEN = token;
    },

    /**
     * Gets and sets the map's default API URL for requesting tiles, styles, sprites, and glyphs
     *
     * @var {string} baseApiUrl
     * @example
     * mapboxgl.baseApiUrl = 'https://api.mapbox.com';
     */
    get baseApiUrl(): ?string {
        return config.API_URL;
    },

    set baseApiUrl(url: string) {
        config.API_URL = url;
    },

    /**
     * Gets and sets the number of web workers instantiated on a page with GL JS maps.
     * By default, it is set to half the number of CPU cores (capped at 6).
     * Make sure to set this property before creating any map instances for it to have effect.
     *
     * @var {string} workerCount
     * @example
     * mapboxgl.workerCount = 2;
     */
    get workerCount(): number {
        return WorkerPool.workerCount;
    },

    set workerCount(count: number) {
        WorkerPool.workerCount = count;
    },

    /**
     * Gets and sets the maximum number of images (raster tiles, sprites, icons) to load in parallel,
     * which affects performance in raster-heavy maps. 16 by default.
     *
     * @var {string} maxParallelImageRequests
     * @example
     * mapboxgl.maxParallelImageRequests = 10;
     */
    get maxParallelImageRequests(): number {
        return config.MAX_PARALLEL_IMAGE_REQUESTS;
    },

    set maxParallelImageRequests(numRequests: number) {
        config.MAX_PARALLEL_IMAGE_REQUESTS = numRequests;
    },

    /**
     * Clears browser storage used by this library. Using this method flushes the Mapbox tile
     * cache that is managed by this library. Tiles may still be cached by the browser
     * in some cases.
     *
     * This API is supported on browsers where the [`Cache` API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
     * is supported and enabled. This includes all major browsers when pages are served over
     * `https://`, except Internet Explorer and Edge Mobile.
     *
     * When called in unsupported browsers or environments (private or incognito mode), the
     * callback will be called with an error argument.
     *
     * @function clearStorage
     * @param {Function} callback Called with an error argument if there is an error.
     */
    clearStorage(callback?: (err: ?Error) => void) {
        clearTileCache(callback);
    },

    workerUrl: ''
};

/**
 * The version of Mapbox GL JS in use as specified in `package.json`,
 * `CHANGELOG.md`, and the GitHub release.
 *
 * @var {string} version
 */

/**
 * Test whether the browser [supports Mapbox GL JS](https://www.mapbox.com/help/mapbox-browser-support/#mapbox-gl-js).
 *
 * @function supported
 * @param {Object} [options]
 * @param {boolean} [options.failIfMajorPerformanceCaveat=false] If `true`,
 *   the function will return `false` if the performance of Mapbox GL JS would
 *   be dramatically worse than expected (e.g. a software WebGL renderer would be used).
 * @return {boolean}
 * @example
 * mapboxgl.supported() // = true
 * @see [Check for browser support](https://www.mapbox.com/mapbox-gl-js/example/check-for-support/)
 */

/**
 * Sets the map's [RTL text plugin](https://www.mapbox.com/mapbox-gl-js/plugins/#mapbox-gl-rtl-text).
 * Necessary for supporting the Arabic and Hebrew languages, which are written right-to-left. Mapbox Studio loads this plugin by default.
 *
 * @function setRTLTextPlugin
 * @param {string} pluginURL URL pointing to the Mapbox RTL text plugin source.
 * @param {Function} callback Called with an error argument if there is an error.
 * @example
 * mapboxgl.setRTLTextPlugin('https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.0/mapbox-gl-rtl-text.js');
 * @see [Add support for right-to-left scripts](https://www.mapbox.com/mapbox-gl-js/example/mapbox-gl-rtl-text/)
 */

export default exported;

// canary assert: used to confirm that asserts have been removed from production build
assert(true, 'canary assert');
