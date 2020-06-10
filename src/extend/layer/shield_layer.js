// @flow
import CustomLayer from './custom_layer';

import tesselateSphere from './geometry/sphere';

// 顶点着色器
const vs = `
precision mediump float;

attribute vec3 a_pos;
attribute vec2 a_uv;

uniform float u_radius;
uniform vec2 u_pos;
uniform mat4 u_matrix;

varying vec3 v_pos;

void main() {
    // 缩放和平移
    vec3 pos = a_pos * u_radius;
    pos.xy += u_pos;

    gl_Position = u_matrix * vec4(pos, 1.0);

    v_pos = a_pos;
}
`;

// 片源着色器
const fs = `
precision mediump float;

uniform vec4 u_color;

varying vec3 v_pos;

// 菲涅耳公式常量
const float _fresnelBase = 0.01;
const float _fresnelScale = 1.5;
const float _fresnelIndensity = 3.0;

void main() {
    float N = 1.0 - abs(v_pos.x);
    float V = 1.0 - abs(v_pos.y);
    
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
        const { id, position, radius, color, num = 15 } = options;

        if (!(id && position && radius && color)) {
            throw new Error('ShieldLayer：缺少必备参数');
        }

        const { attributes: { POSITION, TEXCOORD_0 }, indices } = tesselateSphere({ nlat: num, nlong: num * 2, endLong: Math.PI });

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
                    },
                    {
                        members: [
                            { name: "a_uv", type: "Float32", components: 2 }
                        ],
                        data: TEXCOORD_0.value
                    }
                ],
                uniforms: [
                    {
                        name: "u_pos", type: "2f", accessor: (layer: any) => {
                            const transform = layer.map.projection.getTransform();
                            const x = transform.mercatorXfromLng(position[0]);
                            const y = transform.mercatorYfromLat(position[1]);
                            return [x, y];
                        }
                    },
                    {
                        name: "u_radius", type: "1f", accessor: (layer: any) => {
                            const transform = layer.map.projection.getTransform();
                            return transform.mercatorZfromAltitude(radius, position[1]);
                        }
                    },
                    { name: "u_color", type: "color", accessor: color },
                    { name: "u_matrix", type: "mat4", accessor: (layer: any) => layer.matrix }
                ],
            }
        });
    }

    beforeRender(program: any) {
        const gl = program.gl;
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.FRONT);
    }

    afterRender(program: any) {
        const gl = program.gl;
        gl.disable(gl.CULL_FACE);
    }
}

export default ShieldLayer;
