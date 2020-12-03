// @flow

import {patternUniformValues} from './pattern';
import {
    Uniform1i,
    Uniform1f,
    Uniform2f,
    Uniform3f,
    UniformMatrix4f
} from '../uniform_binding';

import {mat3, vec3} from 'gl-matrix';
import {extend} from '../../util/util';

import type Context from '../../gl/context';
import type Painter from '../painter';
import type {OverscaledTileID} from '../../source/tile_id';
import type {UniformValues, UniformLocations} from '../uniform_binding';
import type {CrossfadeParameters} from '../../style/evaluation_parameters';
import type Tile from '../../source/tile';
// GeoGlobal-fill-extrusion-huangwei
// GeoGlobal-fill-extrusion-pattern-huangwei
import type StyleLayer from '../../style/style_layer';

export type FillExtrusionUniformsType = {|
    'u_matrix': UniformMatrix4f,
    'u_lightpos': Uniform3f,
    'u_lightintensity': Uniform1f,
    'u_lightcolor': Uniform3f,
    'u_vertical_gradient': Uniform1f,
    'u_opacity': Uniform1f,
    // GeoGlobal-fill-extrusion-huangwei
    'u_type': Uniform1i
|};

export type FillExtrusionPatternUniformsType = {|
    'u_matrix': UniformMatrix4f,
    'u_lightpos': Uniform3f,
    'u_lightintensity': Uniform1f,
    'u_lightcolor': Uniform3f,
    'u_height_factor': Uniform1f,
    'u_vertical_gradient': Uniform1f,
    // pattern uniforms:
    'u_texsize': Uniform2f,
    'u_image': Uniform1i,
    'u_pixel_coord_upper': Uniform2f,
    'u_pixel_coord_lower': Uniform2f,
    'u_scale': Uniform3f,
    'u_fade': Uniform1f,
    'u_opacity': Uniform1f,
    // GeoGlobal-fill-extrusion-pattern-huangwei
    'u_type': Uniform1i
|};

const fillExtrusionUniforms = (context: Context, locations: UniformLocations): FillExtrusionUniformsType => ({
    'u_matrix': new UniformMatrix4f(context, locations.u_matrix),
    'u_lightpos': new Uniform3f(context, locations.u_lightpos),
    'u_lightintensity': new Uniform1f(context, locations.u_lightintensity),
    'u_lightcolor': new Uniform3f(context, locations.u_lightcolor),
    'u_vertical_gradient': new Uniform1f(context, locations.u_vertical_gradient),
    'u_opacity': new Uniform1f(context, locations.u_opacity),
    // GeoGlobal-fill-extrusion-huangwei
    'u_type': new Uniform1i(context, locations.u_type)
});

const fillExtrusionPatternUniforms = (context: Context, locations: UniformLocations): FillExtrusionPatternUniformsType => ({
    'u_matrix': new UniformMatrix4f(context, locations.u_matrix),
    'u_lightpos': new Uniform3f(context, locations.u_lightpos),
    'u_lightintensity': new Uniform1f(context, locations.u_lightintensity),
    'u_lightcolor': new Uniform3f(context, locations.u_lightcolor),
    'u_vertical_gradient': new Uniform1f(context, locations.u_vertical_gradient),
    'u_height_factor': new Uniform1f(context, locations.u_height_factor),
    // pattern uniforms
    'u_image': new Uniform1i(context, locations.u_image),
    'u_texsize': new Uniform2f(context, locations.u_texsize),
    'u_pixel_coord_upper': new Uniform2f(context, locations.u_pixel_coord_upper),
    'u_pixel_coord_lower': new Uniform2f(context, locations.u_pixel_coord_lower),
    'u_scale': new Uniform3f(context, locations.u_scale),
    'u_fade': new Uniform1f(context, locations.u_fade),
    'u_opacity': new Uniform1f(context, locations.u_opacity),
    // GeoGlobal-fill-extrusion-pattern-huangwei
    'u_type': new Uniform1i(context, locations.u_type)
});

const fillExtrusionUniformValues = (
    matrix: Float32Array,
    painter: Painter,
    shouldUseVerticalGradient: boolean,
    opacity: number,
    layer: ?StyleLayer
): UniformValues<FillExtrusionUniformsType> => {
    const light = painter.style.light;
    const _lp = light.properties.get('position');
    const lightPos = [_lp.x, _lp.y, _lp.z];
    const lightMat = mat3.create();
    if (light.properties.get('anchor') === 'viewport') {
        mat3.fromRotation(lightMat, -painter.transform.angle);
    }
    vec3.transformMat3(lightPos, lightPos, lightMat);

    const lightColor = light.properties.get('color');

    // GeoGlobal-fill-extrusion-huangwei
    let uType = 0;
    if (layer) {
        const intensity = layer.getPaintProperty('fill-extrusion-intensity');
        const bottomColor = layer.getPaintProperty('fill-extrusion-bottom-color');

        // 渐变变强
        if (intensity) uType = 1;
        // 双色
        if (bottomColor) uType = 2;
    }

    return {
        'u_matrix': matrix,
        'u_lightpos': lightPos,
        'u_lightintensity': light.properties.get('intensity'),
        'u_lightcolor': [lightColor.r, lightColor.g, lightColor.b],
        'u_vertical_gradient': +shouldUseVerticalGradient,
        'u_opacity': opacity,
        // GeoGlobal-fill-extrusion-huangwei
        'u_type': uType
    };
};

const fillExtrusionPatternUniformValues = (
    matrix: Float32Array,
    painter: Painter,
    shouldUseVerticalGradient: boolean,
    opacity: number,
    coord: OverscaledTileID,
    crossfade: CrossfadeParameters,
    tile: Tile,
    layer: ?StyleLayer
): UniformValues<FillExtrusionPatternUniformsType> => {
    // GeoGlobal-fill-extrusion-pattern-huangwei
    let uType = 0;
    if (layer) {
        const repeat = (layer.paint: any).get('fill-extrusion-pattern-repeat');

        // 非重复贴图模式
        if (repeat === false) uType = 1;
    }

    return extend(fillExtrusionUniformValues(matrix, painter, shouldUseVerticalGradient, opacity),
        patternUniformValues(crossfade, painter, tile),
        {
            'u_height_factor': -Math.pow(2, coord.overscaledZ) / tile.tileSize / 8,
            // GeoGlobal-fill-extrusion-pattern-huangwei
            'u_type': uType
        });
};

export {
    fillExtrusionUniforms,
    fillExtrusionPatternUniforms,
    fillExtrusionUniformValues,
    fillExtrusionPatternUniformValues
};
