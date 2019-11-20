// This file is generated. Edit build/generate-style-code.js, then run `yarn run codegen`.
// @flow
/* eslint-disable */

import styleSpec from '../../style-spec/reference/latest';

import {
    Properties,
    DataConstantProperty,
    DataDrivenProperty,
    CrossFadedDataDrivenProperty,
    CrossFadedProperty,
    ColorRampProperty
} from '../properties';

import type Color from '../../style-spec/util/color';

import type Formatted from '../../style-spec/expression/types/formatted';

export type LayoutProps = {|
    "sprite-cap": DataConstantProperty<"butt" | "round" | "square">,
    "sprite-join": DataDrivenProperty<"bevel" | "round" | "miter">,
    "sprite-miter-limit": DataConstantProperty<number>,
    "sprite-round-limit": DataConstantProperty<number>,
|};

const layout: Properties<LayoutProps> = new Properties({
    "sprite-cap": new DataConstantProperty(styleSpec["layout_sprite"]["sprite-cap"]),
    "sprite-join": new DataDrivenProperty(styleSpec["layout_sprite"]["sprite-join"]),
    "sprite-miter-limit": new DataConstantProperty(styleSpec["layout_sprite"]["sprite-miter-limit"]),
    "sprite-round-limit": new DataConstantProperty(styleSpec["layout_sprite"]["sprite-round-limit"]),
});

export type PaintProps = {|
    "sprite-opacity": DataDrivenProperty<number>,
    "sprite-color": DataDrivenProperty<Color>,
    "sprite-translate": DataConstantProperty<[number, number]>,
    "sprite-translate-anchor": DataConstantProperty<"map" | "viewport">,
    "sprite-width": DataDrivenProperty<number>,
    "sprite-gap-width": DataDrivenProperty<number>,
    "sprite-offset": DataDrivenProperty<number>,
    "sprite-blur": DataDrivenProperty<number>,
	"sprite-speed-factor": DataConstantProperty<number>,
|};

const paint: Properties<PaintProps> = new Properties({
    "sprite-opacity": new DataDrivenProperty(styleSpec["paint_sprite"]["sprite-opacity"]),
    "sprite-color": new DataDrivenProperty(styleSpec["paint_sprite"]["sprite-color"]),
    "sprite-translate": new DataConstantProperty(styleSpec["paint_sprite"]["sprite-translate"]),
    "sprite-translate-anchor": new DataConstantProperty(styleSpec["paint_sprite"]["sprite-translate-anchor"]),
    "sprite-width": new DataDrivenProperty(styleSpec["paint_sprite"]["sprite-width"]),
    "sprite-gap-width": new DataDrivenProperty(styleSpec["paint_sprite"]["sprite-gap-width"]),
    "sprite-offset": new DataDrivenProperty(styleSpec["paint_sprite"]["sprite-offset"]),
    "sprite-blur": new DataDrivenProperty(styleSpec["paint_sprite"]["sprite-blur"]),
	"sprite-speed-factor": new DataConstantProperty(styleSpec["paint_sprite"]["sprite-speed-factor"]),
});

// Note: without adding the explicit type annotation, Flow infers weaker types
// for these objects from their use in the constructor to StyleLayer, as
// {layout?: Properties<...>, paint: Properties<...>}
export default ({ paint, layout }: $Exact<{
  paint: Properties<PaintProps>, layout: Properties<LayoutProps>
}>);
