// @flow

import { extend, pick } from '../util/util';

import { getImage, ResourceType } from '../util/ajax';
import { Event, ErrorEvent, Evented } from '../util/evented';
import loadTileJSON from './load_tilejson';
import { postTurnstileEvent, postMapLoadEvent } from '../util/mapbox';
import TileBounds from './tile_bounds';
import Texture from '../render/texture';

import { cacheEntryPossiblyAdded } from '../util/tile_request_cache';

import type {Source} from './source';
import type {OverscaledTileID} from './tile_id';
import type Map from '../ui/map';
import type Dispatcher from '../util/dispatcher';
import type Tile from './tile';
import type {Callback} from '../types/callback';
import type {Cancelable} from '../types/cancelable';
import type {
    RasterSourceSpecification,
    RasterDEMSourceSpecification
} from '../style-spec/types';

class RasterTileSource extends Evented implements Source {
    type: 'raster' | 'raster-dem';
    id: string;
    minzoom: number;
    maxzoom: number;
    url: string;
    scheme: string;
    tileSize: number;
    // GeoGlobal-raster-huangwei-191111 支持百度瓦片和Arcgis瓦片
    rasterType: string;
    zoomOffset: number;

    bounds: ?[number, number, number, number];
    tileBounds: TileBounds;
    roundZoom: boolean;
    dispatcher: Dispatcher;
    map: Map;
    tiles: Array<string>;

    _loaded: boolean;
    _options: RasterSourceSpecification | RasterDEMSourceSpecification;
    _tileJSONRequest: ?Cancelable;

    constructor(id: string, options: RasterSourceSpecification | RasterDEMSourceSpecification, dispatcher: Dispatcher, eventedParent: Evented) {
        super();
        this.id = id;
        this.dispatcher = dispatcher;
        this.setEventedParent(eventedParent);

        this.type = 'raster';
        this.minzoom = 0;
        this.maxzoom = 22;
        this.roundZoom = true;
        this.scheme = 'xyz';
        // GeoGlobal-tileSize-huangwei-191113
        this.tileSize = options.defaultTileSize;
        // GeoGlobal-raster-huangwei-191111
        this.rasterType = 'xyz';
        this.zoomOffset = 0;

        this._loaded = false;

        this._options = extend({ type: 'raster' }, options);
        // GeoGlobal-raster-huangwei-191111
        extend(this, pick(options, ['url', 'scheme', 'tileSize', 'rasterType', 'zoomOffset']));
    }

    load() {
        this._loaded = false;
        this.fire(new Event('dataloading', {dataType: 'source'}));
        this._tileJSONRequest = loadTileJSON(this._options, this.map._requestManager, (err, tileJSON) => {
            this._tileJSONRequest = null;
            this._loaded = true;
            if (err) {
                this.fire(new ErrorEvent(err));
            } else if (tileJSON) {
                extend(this, tileJSON);
                // GeoGlobal-coord-huangwei-191105
                if (tileJSON.bounds) this.tileBounds = new TileBounds(tileJSON.bounds, this.map.projection, this.minzoom, this.maxzoom);

                postTurnstileEvent(tileJSON.tiles);
                postMapLoadEvent(tileJSON.tiles, this.map._getMapId(), this.map._requestManager._skuToken);

                // `content` is included here to prevent a race condition where `Style#_updateSources` is called
                // before the TileJSON arrives. this makes sure the tiles needed are loaded once TileJSON arrives
                // ref: https://github.com/mapbox/mapbox-gl-js/pull/4347#discussion_r104418088
                this.fire(new Event('data', {dataType: 'source', sourceDataType: 'metadata'}));
                this.fire(new Event('data', {dataType: 'source', sourceDataType: 'content'}));
            }
        });
    }

    loaded(): boolean {
        return this._loaded;
    }

    onAdd(map: Map) {
        this.map = map;
        this.load();
    }

    onRemove() {
        if (this._tileJSONRequest) {
            this._tileJSONRequest.cancel();
            this._tileJSONRequest = null;
        }
    }

    serialize() {
        return extend({}, this._options);
    }

    hasTile(tileID: OverscaledTileID) {
        return !this.tileBounds || this.tileBounds.contains(tileID.canonical);
    }

    loadTile(tile: Tile, callback: Callback<void>) {
        // GeoGlobal-raster-huangwei-191111
        const url = this.map._requestManager.normalizeTileURL(tile.tileID.canonical.url(this.tiles,
            this.map.projection,
            {
                scheme: this.scheme,
                rasterType: this.rasterType,
                zoomOffset: this.zoomOffset
            }), this.url, this.tileSize);
        tile.request = getImage(this.map._requestManager.transformRequest(url, ResourceType.Tile), (err, img) => {
            delete tile.request;

            if (tile.aborted) {
                tile.state = 'unloaded';
                callback(null);
            } else if (err) {
                tile.state = 'errored';
                callback(err);
            } else if (img) {
                if (this.map._refreshExpiredTiles) tile.setExpiryData(img);
                delete (img: any).cacheControl;
                delete (img: any).expires;

                const context = this.map.painter.context;
                const gl = context.gl;
                tile.texture = this.map.painter.getTileTexture(img.width);
                if (tile.texture) {
                    tile.texture.update(img, { useMipmap: true });
                } else {
                    tile.texture = new Texture(context, img, gl.RGBA, { useMipmap: true });
                    tile.texture.bind(gl.LINEAR, gl.CLAMP_TO_EDGE, gl.LINEAR_MIPMAP_NEAREST);

                    if (context.extTextureFilterAnisotropic) {
                        gl.texParameterf(gl.TEXTURE_2D, context.extTextureFilterAnisotropic.TEXTURE_MAX_ANISOTROPY_EXT, context.extTextureFilterAnisotropicMax);
                    }
                }

                tile.state = 'loaded';

                cacheEntryPossiblyAdded(this.dispatcher);

                callback(null);
            }
        });
    }

    abortTile(tile: Tile, callback: Callback<void>) {
        if (tile.request) {
            tile.request.cancel();
            delete tile.request;
        }
        callback();
    }

    unloadTile(tile: Tile, callback: Callback<void>) {
        if (tile.texture) this.map.painter.saveTileTexture(tile.texture);
        callback();
    }

    hasTransition() {
        return false;
    }
}

export default RasterTileSource;
