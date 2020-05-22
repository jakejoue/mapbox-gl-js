// @flow
import CustomLayer from './custom_layer';

import tesselateSphere from './geometry/sphere';

// 顶点着色器
const vs = `
precision mediump float;

attribute vec3 a_pos;

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

void main() {
    // float dis = distance(v_pos.xy, vec2(0.0, 0.0));

    vec4 color = u_color;
    gl_FragColor = u_color * pow(v_pos.x, 2.0);

    if (v_pos.z <= 0.5) {
        float z = (1.0 - v_pos.z) * 0.5;
        gl_FragColor = u_color * pow(z, 2.0);
    }
}
`;

type ShieldLayerOptions = {
    id: string,
    position: [number, number],
    radius: number,
    color: ?string,
    num: ?number
}

class ShieldLayer extends CustomLayer {
    constructor(options: ShieldLayerOptions) {
        const { id, position, radius, color, num = 15 } = options;

        if (!(id && position && radius && color)) {
            throw new Error('ShieldLayer：缺少必备参数');
        }

        const { attributes: { POSITION }, indices } = tesselateSphere({ nlat: num, nlong: num * 2, endLong: Math.PI });

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
                    {
                        name: "u_pos", type: "2f", accessor: layer => {
                            const transform = layer.map.projection.getTransform();
                            const x = transform.mercatorXfromLng(position[0]);
                            const y = transform.mercatorYfromLat(position[1]);
                            return [x, y];
                        }
                    },
                    {
                        name: "u_radius", type: "1f", accessor: layer => {
                            const transform = layer.map.projection.getTransform();
                            return transform.mercatorZfromAltitude(radius, position[1]);
                        }
                    },
                    { name: "u_color", type: "color", accessor: color },
                    { name: "u_matrix", type: "mat4", accessor: layer => layer.matrix }
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
