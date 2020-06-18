// @flow
import CustomLayer from './custom_layer';

import { mat4 } from 'gl-matrix';

// 顶点着色器
const vs = `
precision mediump float;

attribute vec2 a_pos;

varying vec2 v_pos;

// 对象转换方式
uniform mat4 u_obj_matrix;
uniform mat4 u_matrix;

void main() {
    gl_Position = u_matrix * u_obj_matrix * vec4(a_pos, 0.0, 1.0);

    v_pos = a_pos;
}
`;

// 片源着色器
const fs = `
precision mediump float;

varying vec2 v_pos;

// uniform vec4 u_color;

void main() {
    if (length(v_pos) > 1.0) {
        discard;
    }
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    // gl_FragColor = u_color;
}
`;

type ImageCircleOptions = {
    id: string,
    position: [number, number],
    radius: number,
    reverse: ?boolean,
    color: ?string
}

class ImageCircle extends CustomLayer {
    constructor(options: ImageCircleOptions) {
        const { id, position, radius, reverse = false, color } = options;

        if (!(id && position && radius && color)) {
            throw new Error('radarLayer：缺少必备参数');
        }

        const startRadius = 0;

        let objm = null;

        super({
            id,
            programs: {
                vs, fs,
                // 两个三角形顶点
                indices: new Uint16Array([
                    0, 2, 1,
                    1, 2, 3
                ]),
                attributes: [
                    {
                        members: [
                            { name: "a_pos", type: "Float32", components: 2 },
                        ],
                        // ┌──────┐
                        // │ 0  1 │ Counter-clockwise winding order.
                        // │      │ Triangle 1: 0 => 2 => 1
                        // │ 2  3 │ Triangle 2: 1 => 2 => 3
                        // └──────┘
                        data: new Float32Array([
                            -1, 1, 1, 1,
                            -1, -1, 1, -1
                        ]),
                    },
                ],
                uniforms: [
                    // {
                    //     name: "u_start_angle", type: "1f", accessor: () => {
                    //         startRadius += 1;
                    //         return startRadius / 180 * (Math.PI * 2);
                    //     }
                    // },
                    // { name: "u_color", type: "color", accessor: color },
                    {
                        name: "u_obj_matrix", type: "mat4", accessor: layer => {
                            if (!objm) {
                                const transform = layer.map.projection.getTransform();
                                const x = transform.mercatorXfromLng(position[0]);
                                const y = transform.mercatorYfromLat(position[1]);
                                const scale = transform.mercatorZfromAltitude(radius, position[1]);

                                const m = mat4.create();
                                // 平移
                                mat4.translate(m, m, [x, y, 0]);

                                // 缩放
                                mat4.scale(m, m, [scale, -scale, 1]);

                                objm = m;
                            }

                            return objm;
                        }
                    },
                    { name: "u_matrix", type: "mat4", accessor: layer => layer.matrix }
                ],
            }
        });
    }
}

export default ImageCircle;
