// @flow
// GeoGlobal-sprite-huangwei

import {createLayout} from '../../util/struct_array';

const spriteLayoutAttributes = createLayout([
    {name: 'a_pos_normal', components: 4, type: 'Int16'},
    {name: 'a_data', components: 4, type: 'Uint8'},
    {name: 'a_extra_m', components: 3, type: 'Uint8'},
    {name: 'a_i_p_e', components: 2, type: 'Uint16'}
], 4);

export default spriteLayoutAttributes;
export const {members, size, alignment} = spriteLayoutAttributes;
