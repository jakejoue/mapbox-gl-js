// @flow
// GeoGlobal-sprite-huangwei

import DepthMode from '../gl/depth_mode';
import CullFaceMode from '../gl/cull_face_mode';
import {spriteUniformValues} from './program/sprite_program';

import type Painter from './painter';
import type SourceCache from '../source/source_cache';
import type SpriteStyleLayer from '../style/style_layer/sprite_style_layer';
import type SpriteBucket from '../data/bucket/sprite_bucket';
import type {OverscaledTileID} from '../source/tile_id';

const curEleObj = {
    speedExt1: 2,
    speedExt2: 4,
    speedExt3: 5,
    speedExt4: 6,
    getCalculatedSpeed(speedFactor, layer) {
        return parseInt(layer.speed[`speed${speedFactor}`] / speedFactor / this[`speedExt${speedFactor}`]);
    }
};

export default function drawSprite(painter: Painter, sourceCache: SourceCache, layer: SpriteStyleLayer, coords: Array<OverscaledTileID>) {
    if (painter.renderPass !== 'translucent') return;

    const opacity = layer.paint.get('sprite-opacity');
    const width = layer.paint.get('sprite-width');
    if (opacity.constantOr(1) === 0 || width.constantOr(1) === 0) return;

    const depthMode = painter.depthModeForSublayer(0, DepthMode.ReadOnly);
    const colorMode = painter.colorModeForRenderPass();

    const programId = 'sprite';
    const speedFactor = layer.paint.get("sprite-speed-factor");

    if (!layer.speed.hasOwnProperty(`speed${speedFactor}`)) {
        layer.speed[`speed${speedFactor}`] = 0;
    }

    layer.speed[`speed${speedFactor}`] += 1;
    layer.speed[`speed${speedFactor}`] %= speedFactor === 1 ? 20 : speedFactor === 2 ? 80 : speedFactor === 3 ? 150 : 240;

    const context = painter.context;
    const gl = context.gl;

    for (const coord of coords) {
        const tile = sourceCache.getTile(coord);

        const bucket: ?SpriteBucket = (tile.getBucket(layer): any);
        if (!bucket) continue;

        const programConfiguration = bucket.programConfigurations.get(layer.id);
        const program = painter.useProgram(programId, programConfiguration);

        const speedArray = [curEleObj.getCalculatedSpeed(1, layer), curEleObj.getCalculatedSpeed(2, layer), curEleObj.getCalculatedSpeed(3, layer), curEleObj.getCalculatedSpeed(4, layer)];
        const uniformValues = spriteUniformValues(painter, tile, layer, speedArray);

        program.draw(context, gl.TRIANGLES, depthMode,
            painter.stencilModeForClipping(coord), colorMode, CullFaceMode.disabled, uniformValues,
            layer.id, bucket.layoutVertexBuffer, bucket.indexBuffer, bucket.segments,
            layer.paint, painter.transform.zoom, programConfiguration);
    }
}
