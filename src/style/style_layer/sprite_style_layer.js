// @flow
// GeoGlobal-sprite-huangwei

import StyleLayer from '../style_layer';
import SpriteBucket from '../../data/bucket/sprite_bucket';
import properties from './sprite_style_layer_properties';
import {extend} from '../../util/util';
import EvaluationParameters from '../evaluation_parameters';
import {Transitionable, Transitioning, Layout, PossiblyEvaluated, DataDrivenProperty} from '../properties';

import type {BucketParameters} from '../../data/bucket';
import type {LayoutProps, PaintProps} from './sprite_style_layer_properties';
import type {LayerSpecification} from '../../style-spec/types';

class SpriteFloorwidthProperty extends DataDrivenProperty<number> {
    useIntegerZoom: true;

    possiblyEvaluate(value, parameters) {
        parameters = new EvaluationParameters(Math.floor(parameters.zoom), {
            now: parameters.now,
            fadeDuration: parameters.fadeDuration,
            zoomHistory: parameters.zoomHistory,
            transition: parameters.transition
        });
        return super.possiblyEvaluate(value, parameters);
    }

    evaluate(value, globals, feature, featureState) {
        globals = extend({}, globals, {zoom: Math.floor(globals.zoom)});
        return super.evaluate(value, globals, feature, featureState);
    }
}

const lineFloorwidthProperty = new SpriteFloorwidthProperty(properties.paint.properties['sprite-width'].specification);
lineFloorwidthProperty.useIntegerZoom = true;

class SpriteStyleLayer extends StyleLayer {
    _unevaluatedLayout: Layout<LayoutProps>;
    layout: PossiblyEvaluated<LayoutProps>;

    _transitionablePaint: Transitionable<PaintProps>;
    _transitioningPaint: Transitioning<PaintProps>;
    paint: PossiblyEvaluated<PaintProps>;

    // 速度值
    speed: any;

    constructor(layer: LayerSpecification) {
        super(layer, properties);

        this.speed = {};
    }

    recalculate(parameters: EvaluationParameters, availableImages: Array<string>) {
        super.recalculate(parameters, availableImages);

        (this.paint._values: any)['sprite-floorwidth'] =
            lineFloorwidthProperty.possiblyEvaluate(this._transitioningPaint._values['sprite-width'].value, parameters);
    }

    createBucket(parameters: BucketParameters<*>) {
        return new SpriteBucket(parameters);
    }

    queryRadius(): number {
        return 0;
    }

    queryIntersectsFeature(): boolean {
        return false;
    }

    isTileClipped() {
        return true;
    }
}

export default SpriteStyleLayer;
