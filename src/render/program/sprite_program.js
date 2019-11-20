// @flow
/* eslint-disable */

import {
    Uniform1i,
    Uniform1f,
    Uniform2f,
    Uniform4f,
    UniformMatrix4f
} from '../uniform_binding';
import pixelsToTileUnits from '../../source/pixels_to_tile_units';
import { extend } from '../../util/util';
import browser from '../../util/browser';

import type Context from '../../gl/context';
import type {UniformValues, UniformLocations} from '../uniform_binding';
import type Transform from '../../geo/transform';
import type Tile from '../../source/tile';
import type {CrossFaded} from '../../style/properties';
import type SpriteStyleLayer from '../../style/style_layer/sprite_style_layer';
import type Painter from '../painter';
import type {CrossfadeParameters} from '../../style/evaluation_parameters';

export type SpriteUniformsType = {|
    'u_matrix': UniformMatrix4f,
    'u_ratio': Uniform1f,
    'u_gl_units_to_pixels': Uniform2f,
	'u_speed_mat': Uniform4f
|};

const spriteUniforms = (context: Context, locations: UniformLocations): SpriteUniformsType => ({
    'u_matrix': new UniformMatrix4f(context, locations.u_matrix),
    'u_ratio': new Uniform1f(context, locations.u_ratio),
    'u_gl_units_to_pixels': new Uniform2f(context, locations.u_gl_units_to_pixels),
    'u_speed_mat': new Uniform4f(context, locations.u_speed_mat)
});

const spriteUniformValues = (
    painter: Painter,
    tile: Tile,
    layer: SpriteStyleLayer,
	speedArray: Array
): UniformValues<SpriteUniformsType> => {
    const transform = painter.transform;

    return {
        'u_matrix': calculateMatrix(painter, tile, layer),
        'u_ratio': 1 / pixelsToTileUnits(tile, 1, transform.zoom),
        'u_gl_units_to_pixels': [
            1 / transform.pixelsToGLUnits[0],
            1 / transform.pixelsToGLUnits[1]
        ],
        'u_speed_mat': speedArray
    };
};

function calculateMatrix(painter, tile, layer) {
    return painter.translatePosMatrix(
        tile.tileID.posMatrix,
        tile,
        layer.paint.get('sprite-translate'),
        layer.paint.get('sprite-translate-anchor')
    );
}

export {
    spriteUniforms,
    spriteUniformValues
};
