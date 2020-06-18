// @flow
import CustomLayer from './custom_layer';

import tesselateSphere from './geometry/sphere';

import { mat4 } from 'gl-matrix';

// 顶点着色器
const vs = `
precision mediump float;

attribute vec3 a_pos;

uniform mat4 u_obj_matrix;
uniform mat4 u_matrix;

varying vec3 v_pos;

void main() {
    gl_Position = u_matrix * u_obj_matrix * vec4(a_pos, 1.0);

    v_pos = a_pos;
}
`;

// 片源着色器
const fs = `
precision mediump float;

uniform vec4 u_color;

varying vec3 v_pos;

// 菲涅耳公式常量
const float _fresnelBase = 0.1;
const float _fresnelScale = 1.0;
const float _fresnelIndensity = 20.0;

void main() {
    float N = 1.0 - length(v_pos.xy);
    float V = 1.0 - abs(v_pos.z);
    
    // 菲涅耳公式
    float fresnel = _fresnelBase + _fresnelScale * pow(1.0 - dot(N, V), _fresnelIndensity);

    gl_FragColor = u_color * fresnel;
}
`;

type ShieldLayerOptions = {
    id: string,
    position: [number, number],
    radius: number,
    color: string,
    num: number
}

class ShieldLayer extends CustomLayer {
    constructor(options: ShieldLayerOptions) {
        const { id, position, radius, color, num = 25 } = options;

        if (!(id && position && radius && color)) {
            throw new Error('ShieldLayer：缺少必备参数');
        }

        const { attributes: { POSITION }, indices } = tesselateSphere({ nlat: num, nlong: num * 2, endLong: Math.PI });
        let objm = null;

        super({
            id,
            programs: {
                vs, fs,
                indices: indices.value,
                attributes: [
                    {
                        members: [
                            { name: "a_pos", type: "Float32", components: 3 }
                        ],
                        data: POSITION.value
                    }
                ],
                uniforms: [
                    { name: "u_color", type: "color", accessor: color },
                    {
                        name: "u_obj_matrix", type: "mat4", accessor: (layer: any) => {
                            if (!objm) {
                                const transform = layer.map.projection.getTransform();
                                const x = transform.mercatorXfromLng(position[0]);
                                const y = transform.mercatorYfromLat(position[1]);
                                const scale = transform.mercatorZfromAltitude(radius, position[1]);

                                const m = mat4.create();
                                // 平移
                                mat4.translate(m, m, [x, y, 0]);

                                // 缩放
                                mat4.scale(m, m, [scale, -scale, scale]);

                                objm = m;
                            }
                            return objm;
                        }
                    },
                    { name: "u_matrix", type: "mat4", accessor: (layer: any) => layer.matrix }
                ],
            }
        });
    }

    beforeRender(program: any) {
        const gl = program.gl;
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
    }

    afterRender(program: any) {
        const gl = program.gl;
        gl.disable(gl.CULL_FACE);
    }
}

export default ShieldLayer;
